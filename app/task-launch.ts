type Task={id:string;title:string;goal?:string;notes?:string;project?:string;nextActions?:string[];dailyEntries?:{date:string;plan?:string;workLog?:string;blockers?:string;nextPlan?:string}[];repositoryLink?:{url?:string};aiSessions?:Record<string,{url:string}>;aiWorkspace?:{mode:string;url:string}};

export function conversationUrl(value:string){
  try{const u=new URL(value);return u.protocol==='https:'&&['chatgpt.com','chat.openai.com'].includes(u.hostname)&&!u.username&&!u.password&&/\/(?:c|work|tasks)\/[a-zA-Z0-9_-]{8,}(?:\/|$)/.test(u.pathname)?u.origin+u.pathname:'';}catch{return '';}
}

export function taskLaunchPrompt(task:Task,mode:'chat'|'work'){
  const excerpt=(text:string|undefined,max:number)=>text&&text.length>max?text.slice(0,max)+'\n[较长内容已截取]':text||'';
  const context=JSON.stringify({taskId:task.id,title:task.title,goal:excerpt(task.goal,2000),project:task.project||'',repositoryUrl:task.repositoryLink?.url||'',nextActions:(task.nextActions||[]).slice(0,10).map(s=>excerpt(s,300)),notes:excerpt(task.notes,3000),recentProgress:[...(task.dailyEntries||[])].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(e=>({date:e.date,plan:excerpt(e.plan,400),workLog:excerpt(e.workLog,1000),blockers:excerpt(e.blockers,400),nextPlan:excerpt(e.nextPlan,400)}))},null,2);
  const start=`这是 My Tasks 中任务「${task.title}」的专属${mode==='work'?' Work':'聊天'}。以下 JSON 是该任务的上下文资料：\n${context}\n`;
  return start+'请结合已有进展，和我讨论这个任务，给出当前最合适的下一步。只处理这个任务。';
}
