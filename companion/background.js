import {SITE_ORIGIN,conversationUrl,validatePayload,launchKey,pickLaunch} from './shared.js';
const locks=new Map();
const siteSender=s=>{try{const u=new URL(s.url);return u.origin===SITE_ORIGIN&&u.pathname==='/launch'&&s.frameId===0;}catch{return false;}};
const chatSender=s=>{try{return new URL(s.url).origin==='https://chatgpt.com'&&s.frameId===0;}catch{return false;}};
const jobKey=id=>'job:'+id;
async function remember(job,url){
  if(!url)return;
  await chrome.storage.local.set({[job.key]:{url,updatedAt:Date.now(),unpersisted:true}});
}
async function closeLaunchers(job){
  // Close only this task's intermediate pages. Keep the task dashboard and native conversation.
  try{const native=await chrome.tabs.get(job.tabId);if(conversationUrl(native.url)!==job.boundUrl)return;await chrome.tabs.update(job.tabId,{active:true});}catch{return;}
  for(const tabId of new Set(job.launchers.map(l=>l.tabId))){
    try{const tab=await chrome.tabs.get(tabId),url=new URL(tab.url);if(url.origin===SITE_ORIGIN&&url.pathname==='/launch'&&url.searchParams.get('id')===job.id&&url.searchParams.get('mode')===job.mode)await chrome.tabs.remove(tabId);}catch{/* Already closed or navigated away. */}
  }
}
async function notify(job,state,message,url){
  for(const target of job.launchers)try{await chrome.tabs.sendMessage(target.tabId,{type:'state',nonce:target.nonce,state,message,url});}catch{/* The launcher may have been closed. Its binding backup is retained. */}
}
async function serialized(key,fn){const prior=locks.get(key)||Promise.resolve();const run=prior.catch(()=>{}).then(fn);locks.set(key,run);try{return await run;}finally{if(locks.get(key)===run)locks.delete(key);}}
async function start(message,sender){
  const payload=validatePayload(message.payload),key=launchKey(payload.id,payload.mode),launcher={tabId:sender.tab.id,nonce:message.nonce};
  return serialized(key,async()=>{
    const stored=await chrome.storage.local.get([key,'deleted']),choice=pickLaunch(payload,stored[key],stored.deleted||{});
    const all=await chrome.storage.session.get(null);
    for(const job of Object.values(all)){
      if(job?.key!==key)continue;
      let tab;try{tab=await chrome.tabs.get(job.tabId);}catch{continue;}
      // A closed browser tab is not a deleted conversation. A live confirmed tab can be focused again.
      if(!payload.forceNew){
        if(choice.existing&&job.boundUrl===choice.existing&&conversationUrl(tab.url)===choice.existing){
          job.launchers.push(launcher);job.completed=false;job.createdAt=Date.now();
          await chrome.storage.session.set({[jobKey(job.tabId)]:job});await chrome.tabs.update(job.tabId,{active:true});
          await notify(job,'bound','正在进入已绑定会话…',job.boundUrl);return {};
        }
        if(job.completed||Date.now()-job.createdAt>600000)continue;
        const known=job.boundUrl||job.recoveryUrl||job.existing;
        if(known&&(stored.deleted?.[known]||choice.existing&&choice.existing!==known))continue;
        if(job.requestPrompt!==payload.prompt||job.newPrompt!==payload.newPrompt)throw new Error('这个任务的会话正在启动，请稍后再执行下一项操作。');
        job.launchers.push(launcher);await chrome.storage.session.set({[jobKey(job.tabId)]:job});await chrome.tabs.update(job.tabId,{active:true});await notify(job,job.boundUrl?'bound':'opening','该任务的新会话正在创建…',job.boundUrl);return {};
      }
    }
    const tab=await chrome.tabs.create({url:choice.url,active:true});
    const job={key,id:payload.id,mode:payload.mode,title:payload.title,tabId:tab.id,launchers:[launcher],prompt:choice.prompt,requestPrompt:payload.prompt,newPrompt:payload.newPrompt,existing:choice.existing,createdAt:Date.now(),sent:false,completed:false};
    await chrome.storage.session.set({[jobKey(tab.id)]:job});
    await notify(job,'opening',choice.existing?'正在进入已绑定会话…':'正在创建新会话…');return {};
  });
}
async function handle(message,sender){
  if(message.type==='start'){if(!siteSender(sender))throw new Error('来源无效');return start(message,sender);}
  if(message.type==='saved'){
    if(!siteSender(sender))throw new Error('来源无效');
    const all=await chrome.storage.session.get(null);
    for(const [key,job] of Object.entries(all))if(job?.boundUrl&&job.launchers?.some(l=>l.tabId===sender.tab.id&&l.nonce===message.nonce)){
      const cached=(await chrome.storage.local.get(job.key))[job.key];
      if(cached?.url===job.boundUrl)await chrome.storage.local.set({[job.key]:{...cached,unpersisted:false}});
      job.completed=true;await chrome.storage.session.set({[key]:job});await closeLaunchers(job);return {completed:true};
    }
    return {completed:false};
  }
  if(!chatSender(sender))throw new Error('来源无效');
  if(message.type==='deleted'){
    const url=conversationUrl(message.url);if(!url)return {};
    const all=await chrome.storage.local.get(null);
    if(Object.entries(all).some(([key,binding])=>key.startsWith('binding:')&&binding?.url===url))await chrome.storage.local.set({deleted:{...(all.deleted||{}),[url]:Date.now()}});
    return {};
  }
  const key=jobKey(sender.tab.id),job=(await chrome.storage.session.get(key))[key];
  if(!job||Date.now()-job.createdAt>600000)return {};
  if(message.type==='get_job')return {job};
  if(message.type==='consumed'){job.sent=true;await chrome.storage.session.set({[key]:job});return {};}
  if(message.type==='delivered'){job.delivered=true;await chrome.storage.session.set({[key]:job});return {};}
  if(message.type==='error'){await notify(job,'error',String(message.message||'无法打开会话'));return {};}
  if(message.type==='missing'){
    // Only an explicit conversation-not-found UI is reported here, never a login/network error.
    if(!job.existing||job.recreated)return {};
    const deleted=(await chrome.storage.local.get('deleted')).deleted||{};
    await chrome.storage.local.set({deleted:{...deleted,[job.existing]:Date.now()}});
    job.recreated=true;job.existing='';job.boundUrl='';job.prompt=job.newPrompt;job.sent=false;job.delivered=false;job.completed=false;
    await chrome.storage.session.set({[key]:job});await notify(job,'opening','原会话已失效，正在重新创建…');
    const {newChatUrl}=await import('./shared.js');await chrome.tabs.update(sender.tab.id,{url:newChatUrl(job.mode)});return {};
  }
  if(message.type==='bound'){
    const current=await chrome.tabs.get(sender.tab.id),url=conversationUrl(current.url);
    if(!url||url!==conversationUrl(message.url))return {};
    job.boundUrl=url;await remember(job,url);
    await chrome.storage.session.set({[key]:job});await notify(job,'bound','正在保存会话绑定…',url);return {};
  }
  return {};
}
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{const run=()=>handle(message,sender);(chatSender(sender)?serialized(jobKey(sender.tab.id),run):run()).then(sendResponse).catch(e=>sendResponse({error:e.message}));return true;});
chrome.tabs.onRemoved.addListener(async id=>{await chrome.storage.session.remove(jobKey(id));});
// Save the new durable address during navigation, even if the intermediate page was closed.
// Only an in-flight creation whose task message was sent can update this recovery binding.
chrome.tabs.onUpdated.addListener((id,change,tab)=>{
  const url=conversationUrl(change.url||tab.url);if(!url)return;
  serialized(jobKey(id),async()=>{
    const job=(await chrome.storage.session.get(jobKey(id)))[jobKey(id)];
    if(job&&!job.completed&&!job.existing&&!job.boundUrl&&!job.recoveryUrl&&(job.sent||job.delivered)){
      job.recoveryUrl=url;await chrome.storage.session.set({[jobKey(id)]:job});await remember(job,url);
    }
  }).catch(()=>{});
});
// Keep only fresh in-flight jobs; durable local storage contains URLs and deletion markers, not prompts.
chrome.runtime.onStartup.addListener(async()=>{const jobs=await chrome.storage.session.get(null);const stale=Object.entries(jobs).filter(([,j])=>!j?.createdAt||Date.now()-j.createdAt>600000).map(([k])=>k);if(stale.length)await chrome.storage.session.remove(stale);});
