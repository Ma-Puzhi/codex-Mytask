export const SITE_ORIGIN='http://localhost:5173';
export function conversationUrl(value){
  try{const u=new URL(value);return u.protocol==='https:'&&['chatgpt.com','chat.openai.com'].includes(u.hostname)&&!u.username&&!u.password&&/\/(?:c|work|tasks)\/[a-zA-Z0-9_-]{8,}(?:\/|$)/.test(u.pathname)?'https://chatgpt.com'+u.pathname:'';}catch{return '';}
}
export function validatePayload(p){
  if(!p||typeof p.id!=='string'||!p.id||p.id.length>200||!['chat','work'].includes(p.mode))throw new Error('任务参数无效');
  for(const key of ['prompt','newPrompt'])if(typeof p[key]!=='string'||p[key].length>30000)throw new Error('任务上下文无效');
  if(typeof p.title!=='string'||p.title.length>240)throw new Error('任务名称无效');
  if(p.url&&!conversationUrl(p.url))throw new Error('会话地址无效');
  return {...p,url:conversationUrl(p.url||''),forceNew:p.forceNew===true};
}
export function newChatUrl(mode){const u=new URL('https://chatgpt.com/');u.searchParams.set('surface',mode==='work'?'work':'chat');return u.href;}
export function launchKey(id,mode){return 'binding:'+SITE_ORIGIN+':'+id+':'+mode;}
export function pickLaunch(payload,cache,deleted){
  const server=conversationUrl(payload.url||''),backup=conversationUrl(cache?.url||'');
  const serverUpdated=Date.parse(payload.bindingUpdatedAt||'')||0;
  const candidates=cache?.unpersisted&&cache.updatedAt>serverUpdated?[backup,server]:[server,backup];
  const existing=payload.forceNew?'':candidates.find(url=>url&&!deleted[url])||'';
  const prompt=existing?payload.prompt:payload.newPrompt;
  return {existing,prompt,url:existing||newChatUrl(payload.mode)};
}
