import assert from 'node:assert/strict';
import { SITE_ORIGIN,launchKey } from '../companion/shared.js';
let listener,removed,updated;const messages=[],tabs=new Map();let nextTab=20;
function storage(){const data={};return {async get(keys){if(keys===null)return structuredClone(data);return Object.fromEntries((Array.isArray(keys)?keys:[keys]).filter(k=>data[k]!==undefined).map(k=>[k,structuredClone(data[k])]))},async set(items){Object.assign(data,structuredClone(items))},async remove(keys){for(const k of Array.isArray(keys)?keys:[keys])delete data[k];}};}
globalThis.chrome={storage:{session:storage(),local:storage()},runtime:{onMessage:{addListener(fn){listener=fn}},onStartup:{addListener(){}}},tabs:{async create({url}){const tab={id:nextTab++,url};tabs.set(tab.id,tab);return {...tab}},async get(id){if(!tabs.has(id))throw new Error('closed');return {...tabs.get(id)}},async update(id,changes){if(!tabs.has(id))throw new Error('closed');Object.assign(tabs.get(id),changes)},async sendMessage(id,message){messages.push({id,...message})},async remove(id){tabs.delete(id);if(removed)await removed(id)},onRemoved:{addListener(fn){removed=fn}},onUpdated:{addListener(fn){updated=fn}}}};
await import('../companion/background.js');
const message=(m,s)=>new Promise(resolve=>listener(m,s,resolve));
const launchUrl=SITE_ORIGIN+'/launch?id=task-a&mode=work';
const launcher=(id=1,url=launchUrl)=>({url,frameId:0,tab:{id,url}});
const chat=id=>({url:tabs.get(id)?.url||'https://chatgpt.com/',frameId:0,tab:{id,url:tabs.get(id)?.url}});
const addLauncher=id=>tabs.set(id,{id,url:launchUrl});
addLauncher(1);addLauncher(2);
const payload={id:'task-a',mode:'work',title:'Task A',url:'',prompt:'',newPrompt:'Discuss this task'};
assert.deepEqual(await message({type:'start',nonce:'one',payload},launcher()),{});
assert.equal(tabs.size,3);const id=20;
assert.equal(new URL(tabs.get(id).url).searchParams.get('surface'),'work');
assert.deepEqual(await message({type:'start',nonce:'two',payload},launcher(2)),{});assert.equal(tabs.size,3);
assert.ok((await message({type:'start',nonce:'two',payload:{...payload,prompt:'Different command'}},launcher(2))).error);
assert.ok((await message({type:'start',nonce:'evil',payload},launcher(2,'https://attacker.example/launch'))).error);
await message({type:'consumed'},chat(id));
const url='https://chatgpt.com/c/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';tabs.get(id).url=url;
await message({type:'bound',url},chat(id));
await message({type:'saved',nonce:'wrong'},launcher());assert.ok(tabs.has(1));
tabs.set(7,{id:7,url:SITE_ORIGIN+'/'});
await message({type:'saved',nonce:'one'},launcher());assert.ok(!tabs.has(1));assert.ok(!tabs.has(2));assert.ok(tabs.get(id).active);assert.ok(tabs.has(7));
assert.equal((await chrome.storage.local.get(launchKey(payload.id,payload.mode)))[launchKey(payload.id,payload.mode)].url,url);
// A completed conversation is focused while open; a closed tab reopens the same address.
addLauncher(3);await message({type:'start',nonce:'three',payload},launcher(3));assert.equal(nextTab,21,'Reuse the open bound tab');
await message({type:'saved',nonce:'three'},launcher(3));await chrome.tabs.remove(id);
addLauncher(4);await message({type:'start',nonce:'four',payload},launcher(4));assert.equal(tabs.get(21).url,url,'Closing the native tab must not discard its conversation binding');
await message({type:'error',message:'network failure'},chat(21));assert.equal(tabs.get(21).url,url);
await message({type:'missing'},chat(21));assert.equal(new URL(tabs.get(21).url).pathname,'/');
await message({type:'missing'},chat(21));assert.equal(new URL(tabs.get(21).url).pathname,'/','Recreate only once');
const newUrl='https://chatgpt.com/c/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';tabs.get(21).url=newUrl;
await message({type:'bound',url:newUrl},chat(21));tabs.get(4).url=SITE_ORIGIN+'/';
await message({type:'saved',nonce:'four'},launcher(4));assert.ok(tabs.has(4),'Preserve a launcher navigated to the dashboard');
await chrome.tabs.remove(21);
addLauncher(5);await message({type:'start',nonce:'five',payload:{...payload,url}},launcher(5));assert.equal(tabs.get(22).url,newUrl,'A stale deleted server address must not override the recovered binding');
await message({type:'bound',url:newUrl},chat(22));await message({type:'saved',nonce:'five'},launcher(5));
await message({type:'deleted',url:newUrl},chat(22));await chrome.tabs.remove(22);
addLauncher(6);await message({type:'start',nonce:'six',payload:{...payload,url:newUrl}},launcher(6));assert.equal(new URL(tabs.get(23).url).pathname,'/','Explicit deletion permits a new conversation');
// Closing the launcher before binding cannot lose a sent conversation, even across worker restart.
for(const mode of ['chat','work']){
  const taskId='early-close-'+mode,launch=SITE_ORIGIN+'/launch?id='+taskId+'&mode='+mode;
  const launchId=nextTab+100;tabs.set(launchId,{id:launchId,url:launch});
  const input={...payload,id:taskId,mode},nativeId=nextTab;
  await message({type:'start',nonce:'early',payload:input},launcher(launchId,launch));
  await message({type:'consumed'},chat(nativeId));await chrome.tabs.remove(launchId);
  const persistent='https://chatgpt.com/c/'+mode+'-early-conversation';tabs.get(nativeId).url=persistent;
  updated(nativeId,{url:persistent},tabs.get(nativeId));
  // The message lock ensures navigation backup completed before this read.
  await message({type:'get_job'},chat(nativeId));
  assert.equal((await chrome.storage.local.get(launchKey(taskId,mode)))[launchKey(taskId,mode)].url,persistent);
  await chrome.tabs.remove(nativeId);await chrome.storage.session.remove(Object.keys(await chrome.storage.session.get(null)));
  const retryId=nextTab+100;tabs.set(retryId,{id:retryId,url:launch});const reopened=nextTab;
  await message({type:'start',nonce:'retry',payload:input},launcher(retryId,launch));
  assert.equal(tabs.get(reopened).url,persistent,'Tab closure, launcher closure and worker restart preserve '+mode+' URL');
  assert.equal((await message({type:'get_job'},chat(reopened))).job.prompt,'','Reopening must not resend the initial context');
}
console.log('PASS: open-tab reuse, same URL after tab/launcher closure and worker restart, durable navigation backup, separate Chat/Work bindings, deletion-only recovery, sender/nonce checks, launcher closure and dashboard preservation.');
