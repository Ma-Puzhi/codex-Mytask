import { z } from 'zod';
import { conversationUrl, taskLaunchPrompt } from './task-launch';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => !Number.isNaN(Date.parse(s)) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s,'日期无效');
const status = z.enum(['todo','in_progress','done','deferred','dropped','blocked']);
const workspaceUrl=z.string().trim().max(3000).refine(s=>{if(!s)return true;try{const u=new URL(s);return u.protocol==='https:'&&['chatgpt.com','chat.openai.com'].includes(u.hostname)&&!u.username&&!u.password;}catch{return false;}},'请填写有效的 ChatGPT / Work HTTPS 链接');
const repositoryUrl=z.string().trim().max(2000).refine(s=>{if(!s)return true;try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&u.pathname.split('/').filter(Boolean).length>=2;}catch{return false;}},'请填写有效的 HTTPS 仓库链接，例如 https://github.com/owner/repo');
const longFields={taskType:z.enum(['single','long_term']),startDate:date.nullable(),endDate:date.nullable(),durationDays:z.number().int().min(1).max(3650).nullable(),aiWorkspaceMode:z.enum(['none','chat','work']),aiWorkspaceUrl:workspaceUrl,aiWorkspaceTitle:z.string().max(240)};
const fields = {
  title:z.string().trim().min(1).max(240),notes:z.string().max(5000),goal:z.string().max(3000),project:z.string().max(120),
  tags:z.array(z.string().trim().min(1).max(60)).max(12),nextActions:z.array(z.string().trim().min(1).max(500)).max(20),
  priority:z.enum(['P1','P2','P3','P4']),bucket:z.enum(['today','upcoming','backlog']),dueDate:date.nullable(),estimateMin:z.number().int().min(0).max(100000).nullable(),
};
const optionalFields=Object.fromEntries(Object.entries({...fields,...longFields}).map(([k,v])=>[k,v.optional()]));
const githubFields={
  branch:z.string().trim().min(1).max(255).refine(s=>!s.startsWith('/')&&!s.endsWith('/')&&!s.endsWith('.')&&!s.includes('..')&&!s.includes('//')&&!s.includes('@{')&&!/[\s~^:?*\[\\\u0000-\u001f\u007f]/.test(s)&&s.split('/').every(p=>!p.startsWith('.')&&!p.endsWith('.lock'))&&s!=='@','分支名称无效').optional(),
  path:z.string().trim().max(2000).transform(s=>s.replace(/^\/+|\/+$/g,'')).refine(s=>!s.split('/').some(p=>p==='..'||p==='.')&&!/[\\\u0000-\u001f\u007f]/.test(s),'目录无效').optional(),
  url:z.string().trim().max(2000).optional(),lastCommit:z.string().trim().regex(/^(?:[a-fA-F0-9]{7,64})?$/,'Commit SHA 无效').optional(),
  prUrl:z.string().trim().max(2000).optional(),
};
export const validators:Record<string,z.ZodTypeAny>={
  open_tasks:z.object({}),get_tasks:z.object({today:date.optional()}),
  add_task:z.object({...optionalFields,title:fields.title,today:date.optional()}),
  update_task:z.object({...optionalFields,id:z.string().min(1),status:status.optional(),today:date.optional()}),
  set_task_status:z.object({id:z.string().min(1),status,reason:z.string().max(1000).nullable().optional(),today:date.optional()}),
  review_task:z.object({id:z.string().min(1),decision:z.enum(['tomorrow','deferred','dropped','blocked']),reason:z.enum(['forgot_or_no_time','intentional','not_needed','blocked']).optional(),note:z.string().max(1000).optional(),today:date,newDueDate:date.nullable().optional()}),
  save_daily_report:z.object({date,content:z.string().max(20000)}),set_day_mode:z.object({date,mode:z.enum(['default','rest','work'])}),
  set_weekly_rest_days:z.object({days:z.array(z.number().int().min(0).max(6)).max(7),today:date.optional()}),
  get_task_history:z.object({id:z.string().optional(),limit:z.number().int().min(1).max(200).optional()}),
  link_github_workspace:z.object({id:z.string().min(1),repo:z.string().trim().min(1).max(240),...githubFields,today:date.optional()}),
  update_github_snapshot:z.object({id:z.string().min(1),...githubFields,action:z.string().max(500).optional(),today:date.optional()}),
  unlink_github_workspace:z.object({id:z.string().min(1),today:date.optional()}),
  set_task_repository_link:z.object({id:z.string().min(1),url:repositoryUrl,today:date.optional()}),
  set_task_ai_workspace:z.object({id:z.string().min(1),mode:z.enum(['none','chat','work']),url:workspaceUrl.refine(s=>!s||!!conversationUrl(s),'请填写会话地址，不能使用 ChatGPT 首页').optional(),title:z.string().max(240).optional(),today:date.optional()}),
  get_task_launch:z.object({id:z.string().min(1),mode:z.enum(['chat','work']),action:z.literal('discuss').default('discuss'),today:date.optional()}),
  set_task_chat_link:z.object({id:z.string().min(1),chatUrl:workspaceUrl.optional(),today:date.optional()}),
  set_local_git_workspace:z.object({id:z.string().min(1),device:z.string().max(120).optional(),localPath:z.string().max(4000).optional(),repository:z.string().trim().max(240).refine(s=>!s||/^(?:[A-Za-z0-9][A-Za-z0-9-]*\/)?[A-Za-z0-9_.-]+$/.test(s)&&!['.','..'].includes(s.split('/').at(-1)??''),'仓库名格式无效').optional(),visibility:z.enum(['private','public']).optional(),branch:githubFields.branch,remoteUrl:z.string().trim().max(2000).refine(s=>!s||/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(s),'远程仓库网址无效').optional(),lastCommit:githubFields.lastCommit,today:date.optional()}),
  save_task_day_entry:z.object({id:z.string().min(1),date,plan:z.string().max(5000).optional(),workLog:z.string().max(10000).optional(),blockers:z.string().max(5000).optional(),nextPlan:z.string().max(5000).optional()}),
  save_task_day_plans:z.object({id:z.string().min(1),plans:z.array(z.object({date,plan:z.string().max(5000)})).max(90),today:date.optional()}),
  get_task_timeline:z.object({id:z.string().min(1)}),
};
export const shanghaiDate=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const tomorrow=(s:string)=>{const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
// SQLite rows and validated tool payloads contain heterogeneous JSON values.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecordData=Record<string,any>;
function githubFromRow(r:RecordData){return {repo:r.repo??'',branch:r.branch??'main',path:r.repo_path??'',url:r.repo_url??'',lastCommit:r.last_commit_sha??'',prUrl:r.pr_url??''};}
function taskFromRow(r:RecordData):RecordData&{id:string;title:string}{return {id:r.id,title:r.title,notes:r.notes,goal:r.goal,project:r.project,tags:JSON.parse(r.tags_json),nextActions:JSON.parse(r.next_actions_json),priority:r.priority,bucket:r.bucket,dueDate:r.due_date,estimateMin:r.estimate_min,status:r.status,reviewReason:r.review_reason,createdAt:r.created_at,updatedAt:r.updated_at,completedAt:r.completed_at,github:githubFromRow(r),repositoryLink:{url:r.repo!=null?(r.repo_url||(r.repo?'https://github.com/'+r.repo:'')):(r.local_remote_url??'')},taskType:r.task_type??(r.start_date?'long_term':'single'),startDate:r.start_date??null,endDate:r.end_date??null,durationDays:r.duration_days??null,dailyEntries:[],chat:{url:r.chat_url??'',title:r.conversation_title??''},aiWorkspace:{mode:r.workspace_mode??(r.chat_url?'chat':'none'),url:r.workspace_url??r.chat_url??'',title:r.workspace_title??r.conversation_title??''},localGit:{device:r.device_name??'',localPath:r.local_path??'',repository:r.repository_name??'',visibility:r.local_visibility??'private',branch:r.local_branch??'main',remoteUrl:r.local_remote_url??'',lastCommit:r.local_last_commit??''}};}
const taskSelect='SELECT t.*,g.repo,g.branch,g.repo_path,g.repo_url,g.last_commit_sha,g.pr_url,l.task_type,l.start_date,l.end_date,l.duration_days,c.chat_url,c.conversation_title,w.mode AS workspace_mode,w.workspace_url,w.workspace_title,k.device_name,k.local_path,k.repository_name,k.visibility AS local_visibility,k.branch AS local_branch,k.remote_url AS local_remote_url,k.last_commit_sha AS local_last_commit FROM tasks t LEFT JOIN task_github_workspaces g ON g.task_id=t.id LEFT JOIN task_long_term_settings l ON l.task_id=t.id LEFT JOIN task_chat_links c ON c.task_id=t.id LEFT JOIN task_ai_workspaces w ON w.task_id=t.id LEFT JOIN task_local_git_workspaces k ON k.task_id=t.id';
function eventFromRow(r:RecordData){return {id:r.id,taskId:r.task_id,type:r.event_type,at:r.created_at,...JSON.parse(r.detail_json)};}
export function isTodayTask(t:RecordData,today:string){if(t.taskType==='long_term')return (t.startDate<=today&&today<=t.endDate&&!['done','dropped'].includes(t.status))||(t.completedAt&&shanghaiDate(new Date(t.completedAt))===today);return t.dueDate===today || (t.status!=='done' && ((t.dueDate && t.dueDate<today && t.bucket!=='backlog') || (t.bucket==='today' && !t.dueDate))) || (t.completedAt && shanghaiDate(new Date(t.completedAt))===today);}

export async function buildState(db:D1Database,owner:string,today=shanghaiDate()){
  const results=await db.batch([
    db.prepare(taskSelect+' WHERE t.owner_id=? AND t.status!=? ORDER BY CASE WHEN t.status=\'done\' THEN 1 ELSE 0 END,t.priority,t.created_at').bind(owner,'dropped'),
    db.prepare('SELECT * FROM task_events WHERE owner_id=? ORDER BY created_at DESC, rowid DESC LIMIT 100').bind(owner),
    db.prepare('SELECT * FROM daily_reports WHERE owner_id=? ORDER BY report_date DESC').bind(owner),
    db.prepare('SELECT * FROM app_settings WHERE owner_id=?').bind(owner),
    db.prepare('SELECT e.* FROM task_daily_entries e JOIN tasks t ON t.id=e.task_id WHERE t.owner_id=? ORDER BY e.entry_date').bind(owner),
    db.prepare('SELECT s.* FROM task_ai_sessions s JOIN tasks t ON t.id=s.task_id WHERE t.owner_id=?').bind(owner),
  ]);
  const tasks=(results[0].results as RecordData[]).map(taskFromRow),events=(results[1].results as RecordData[]).map(eventFromRow);
  const byId=new Map(tasks.map(t=>[t.id,t]));for(const e of results[4].results as RecordData[]){byId.get(e.task_id)?.dailyEntries.push({date:e.entry_date,plan:e.plan,workLog:e.work_log,blockers:e.blockers,nextPlan:e.next_plan,updatedAt:e.updated_at});}
  for(const task of tasks){task.aiSessions={};if(conversationUrl(task.chat.url))task.aiSessions.chat={url:conversationUrl(task.chat.url),title:task.chat.title};const w=task.aiWorkspace;if(['chat','work'].includes(w.mode)&&conversationUrl(w.url))task.aiSessions[w.mode]={url:conversationUrl(w.url),title:w.title};}
  for(const s of results[5].results as RecordData[]){const task=byId.get(s.task_id);if(task)task.aiSessions[s.mode]={url:conversationUrl(s.conversation_url),title:s.conversation_title,updatedAt:s.updated_at};}
  const reports=(results[2].results as RecordData[]).map(r=>({id:r.id,date:r.report_date,content:r.content,createdAt:r.created_at,updatedAt:r.updated_at}));
  const settings:RecordData={weeklyRestDays:[],dayOverrides:{}};
  for(const r of results[3].results as RecordData[]){if(r.setting_key==='weekly_rest_days')settings.weeklyRestDays=JSON.parse(r.value_json);if(r.setting_key.startsWith('day:'))settings.dayOverrides[r.setting_key.slice(4)]=JSON.parse(r.value_json);}
  const mode=settings.dayOverrides[today]??'default',weekly=settings.weeklyRestDays.includes(new Date(today+'T12:00:00Z').getUTCDay()),rest=mode==='rest'||(mode==='default'&&weekly);
  const todays=tasks.filter(t=>isTodayTask(t,today));
  return {today,tasks,events,reports,settings,dayInfo:{date:today,mode,isRestDay:rest,source:mode!=='default'?'override':weekly?'weekly':'default'},stats:{plannedToday:todays.length,completedToday:todays.filter(t=>t.status==='done').length,openToday:rest?0:todays.filter(t=>t.status!=='done').length,inProgressToday:todays.filter(t=>t.status==='in_progress').length,focusToday:todays.filter(t=>t.priority==='P1'&&t.status!=='done').length,totalOpen:tasks.filter(t=>t.status!=='done').length,scoringEnabled:!rest}};
}
const taskColumns:Record<string,string>={title:'title',notes:'notes',goal:'goal',project:'project',tags:'tags_json',nextActions:'next_actions_json',priority:'priority',bucket:'bucket',dueDate:'due_date',estimateMin:'estimate_min',status:'status',reviewReason:'review_reason',updatedAt:'updated_at',completedAt:'completed_at'};
function updateStatement(db:D1Database,owner:string,t:RecordData){const keys=Object.keys(taskColumns);return db.prepare('UPDATE tasks SET '+keys.map(k=>taskColumns[k]+'=?').join(',')+' WHERE id=? AND owner_id=?').bind(...keys.map(k=>k==='tags'||k==='nextActions'?JSON.stringify(t[k]):t[k]),t.id,owner);}
function eventStatement(db:D1Database,owner:string,taskId:string|null,type:string,detail:RecordData,at:string){return db.prepare('INSERT INTO task_events(id,owner_id,task_id,event_type,detail_json,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),owner,taskId,type,JSON.stringify(detail),at);}
function settingStatement(db:D1Database,owner:string,key:string,value:unknown,at:string){return db.prepare('INSERT INTO app_settings(owner_id,setting_key,value_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(owner_id,setting_key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at').bind(owner,key,JSON.stringify(value),at);}
function longTermStatement(db:D1Database,id:string,a:RecordData,previous:RecordData,today:string,at:string){
  const type=a.taskType??previous.taskType??'single';
  if(type==='single'&&!previous.startDate)return null;
  const start=a.startDate??previous.startDate??today;
  let days=a.durationDays??previous.durationDays??7;
  let end=a.endDate??null;
  if(end){days=Math.round((Date.parse(end+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000)+1;}
  if(days<1||days>3650)throw new Error('长期任务结束日期必须在开始日期之后，且不超过3650天');
  if(!end){const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days-1);end=d.toISOString().slice(0,10);}
  return db.prepare('INSERT INTO task_long_term_settings(task_id,task_type,start_date,end_date,duration_days,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(task_id) DO UPDATE SET task_type=excluded.task_type,start_date=excluded.start_date,end_date=excluded.end_date,duration_days=excluded.duration_days,updated_at=excluded.updated_at').bind(id,type,start,end,days,at);
}
function workspaceStatements(db:D1Database,id:string,mode:string,url:string,title:string,at:string){
  const ops=[db.prepare('INSERT INTO task_ai_workspaces(task_id,mode,workspace_url,workspace_title,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(task_id) DO UPDATE SET mode=excluded.mode,workspace_url=excluded.workspace_url,workspace_title=excluded.workspace_title,updated_at=excluded.updated_at').bind(id,mode,url,title,at)];
  if(mode==='chat')ops.push(db.prepare('INSERT INTO task_chat_links(task_id,chat_url,conversation_title,updated_at) VALUES(?,?,?,?) ON CONFLICT(task_id) DO UPDATE SET chat_url=excluded.chat_url,conversation_title=excluded.conversation_title,updated_at=excluded.updated_at').bind(id,url,title,at));
  if(['chat','work'].includes(mode))ops.push(db.prepare('INSERT INTO task_ai_sessions(task_id,mode,conversation_url,conversation_title,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(task_id,mode) DO UPDATE SET conversation_url=excluded.conversation_url,conversation_title=excluded.conversation_title,updated_at=excluded.updated_at').bind(id,mode,conversationUrl(url),title,at));
  return ops;
}
export async function executeTool(db:D1Database,owner:string,name:string,input:unknown){
  if(!owner)throw new Error('请先登录');
  if(!validators[name])throw new Error('未知工具');
  const a=validators[name].parse(input) as RecordData,now=new Date().toISOString(),today=a.today??a.date??shanghaiDate();
  if(name==='get_task_launch'){
    const state=await buildState(db,owner,today),task=state.tasks.find(t=>t.id===a.id);if(!task)throw new Error('任务不存在');
    return {content:[{type:'text',text:'已准备任务会话'}],structuredContent:{id:task.id,title:task.title,mode:a.mode,url:task.aiSessions?.[a.mode]?.url||'',bindingUpdatedAt:task.aiSessions?.[a.mode]?.updatedAt||'',prompt:'',newPrompt:taskLaunchPrompt(task,a.mode)}};
  }
  if(name==='get_task_history'){
    const r=await (a.id?db.prepare('SELECT * FROM task_events WHERE owner_id=? AND task_id=? ORDER BY created_at DESC,rowid DESC LIMIT ?').bind(owner,a.id,a.limit??50):db.prepare('SELECT * FROM task_events WHERE owner_id=? ORDER BY created_at DESC,rowid DESC LIMIT ?').bind(owner,a.limit??50)).all();
    return {content:[{type:'text',text:'已读取任务历史'}],structuredContent:{events:(r.results as RecordData[]).map(eventFromRow)}};
  }
  if(name==='get_task_timeline'){
    const state=await buildState(db,owner,today),task=state.tasks.find(t=>t.id===a.id);if(!task)throw new Error('任务不存在');
    return {content:[{type:'text',text:'已读取任务时间线'}],structuredContent:{task:{...task,entries:[...task.dailyEntries].reverse()}}};
  }
  let message='已读取任务';
  const ops:D1PreparedStatement[]=[];
  if(['set_task_ai_workspace','set_task_chat_link','set_local_git_workspace','save_task_day_entry','save_task_day_plans'].includes(name)){
    const row=await db.prepare(taskSelect+' WHERE t.id=? AND t.owner_id=?').bind(a.id,owner).first<RecordData>();if(!row)throw new Error('任务不存在');
    const t=taskFromRow(row);
    if(name==='set_task_ai_workspace'||name==='set_task_chat_link'){
      const mode=name==='set_task_chat_link'?(a.chatUrl?'chat':'none'):a.mode;
      const previous=await db.prepare('SELECT conversation_url FROM task_ai_sessions WHERE task_id=? AND mode=?').bind(a.id,mode).first<RecordData>();
      const url=mode==='none'?'':name==='set_task_chat_link'?(a.chatUrl??t.chat.url):(a.url??previous?.conversation_url??(mode===t.aiWorkspace.mode?t.aiWorkspace.url:mode==='chat'?t.chat.url:''));
      ops.push(...workspaceStatements(db,a.id,mode,url,a.title??t.aiWorkspace.title,now));
      ops.push(eventStatement(db,owner,a.id,'task_ai_workspace_updated',{title:t.title,mode,hasUrl:!!url},now));message='AI 工作区已保存';
    }else if(name==='set_local_git_workspace'){
      const g={...t.localGit};for(const k of ['device','localPath','repository','visibility','branch','remoteUrl','lastCommit'])if(a[k]!==undefined)g[k]=typeof a[k]==='string'?a[k].trim():a[k];
      ops.push(db.prepare('INSERT INTO task_local_git_workspaces(task_id,device_name,local_path,repository_name,visibility,branch,remote_url,last_commit_sha,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(task_id) DO UPDATE SET device_name=excluded.device_name,local_path=excluded.local_path,repository_name=excluded.repository_name,visibility=excluded.visibility,branch=excluded.branch,remote_url=excluded.remote_url,last_commit_sha=excluded.last_commit_sha,updated_at=excluded.updated_at').bind(a.id,g.device,g.localPath,g.repository,g.visibility,g.branch,g.remoteUrl,g.lastCommit,now));
      ops.push(eventStatement(db,owner,a.id,'local_git_workspace_updated',{title:t.title,localGit:g},now));message='Work Git 配置已保存';
    }else if(name==='save_task_day_entry'){
      if(t.taskType!=='long_term'){const range=longTermStatement(db,a.id,{taskType:'long_term',startDate:a.date,durationDays:7},t,today,now);if(range)ops.push(range);}
      const old=await db.prepare('SELECT * FROM task_daily_entries WHERE task_id=? AND entry_date=?').bind(a.id,a.date).first<RecordData>();
      ops.push(db.prepare('INSERT INTO task_daily_entries(task_id,entry_date,plan,work_log,blockers,next_plan,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(task_id,entry_date) DO UPDATE SET plan=excluded.plan,work_log=excluded.work_log,blockers=excluded.blockers,next_plan=excluded.next_plan,updated_at=excluded.updated_at').bind(a.id,a.date,a.plan?.trim()??old?.plan??'',a.workLog?.trim()??old?.work_log??'',a.blockers?.trim()??old?.blockers??'',a.nextPlan?.trim()??old?.next_plan??'',now));
      ops.push(eventStatement(db,owner,a.id,'task_day_saved',{title:t.title,date:a.date},now));message='每日进展已保存';
    }else{
      if(t.taskType!=='long_term')throw new Error('请先将任务设为长期任务');
      for(const p of a.plans)ops.push(db.prepare('INSERT INTO task_daily_entries(task_id,entry_date,plan,updated_at) VALUES(?,?,?,?) ON CONFLICT(task_id,entry_date) DO UPDATE SET plan=excluded.plan,updated_at=excluded.updated_at').bind(a.id,p.date,p.plan.trim(),now));
      ops.push(eventStatement(db,owner,a.id,'task_plans_saved',{title:t.title,dates:a.plans.map((p:RecordData)=>p.date)},now));message='未来计划已保存';
    }
    ops.push(db.prepare('UPDATE tasks SET updated_at=? WHERE id=? AND owner_id=?').bind(now,a.id,owner));
  }else if(name==='set_task_repository_link'){
    const row=await db.prepare(taskSelect+' WHERE t.id=? AND t.owner_id=?').bind(a.id,owner).first<RecordData>();
    if(!row)throw new Error('任务不存在');
    const url=a.url?new URL(a.url):null;
    if(url){url.search='';url.hash='';url.pathname=url.pathname.replace(/\/+$/,'').replace(/\.git$/,'');}
    const saved=url?.href||'',repo=url?url.pathname.slice(1):'';
    ops.push(db.prepare('INSERT INTO task_github_workspaces(task_id,repo,repo_url,updated_at) VALUES(?,?,?,?) ON CONFLICT(task_id) DO UPDATE SET repo=excluded.repo,repo_url=excluded.repo_url,updated_at=excluded.updated_at').bind(a.id,repo,saved,now));
    ops.push(db.prepare('UPDATE tasks SET updated_at=? WHERE id=? AND owner_id=?').bind(now,a.id,owner));
    ops.push(eventStatement(db,owner,a.id,'repository_link_updated',{title:row.title,url:saved},now));message=saved?'仓库链接已保存':'仓库链接已清除';
  }else if(['link_github_workspace','update_github_snapshot','unlink_github_workspace'].includes(name)){
    const row=await db.prepare(taskSelect+' WHERE t.id=? AND t.owner_id=?').bind(a.id,owner).first<RecordData>();
    if(!row)throw new Error('任务不存在');
    const before=githubFromRow(row);
    if(name==='unlink_github_workspace'){
      ops.push(db.prepare('DELETE FROM task_github_workspaces WHERE task_id=?').bind(a.id));
      ops.push(eventStatement(db,owner,a.id,'github_unlinked',{title:row.title,before},now));message='GitHub 关联已解除';
    }else{
      let repo=before.repo;
      if(name==='link_github_workspace'){
        repo=a.repo.replace(/^https:\/\/github\.com\//i,'').replace(/\/+$/,'').replace(/\.git$/,'');
        if(!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repo)||repo.split('/')[1]==='.'||repo.split('/')[1]==='..')throw new Error('请填写 owner/repo 或 GitHub 仓库网址');
      }else if(!repo)throw new Error('请先关联 GitHub 仓库');
      const previous=repo===before.repo?before:{repo,branch:'main',path:'',url:'',lastCommit:'',prUrl:''};
      const gh={...previous,repo};
      for(const key of ['branch','path','lastCommit','prUrl'])if(a[key]!==undefined)gh[key as keyof typeof gh]=a[key];
      gh.url='https://github.com/'+repo;
      if(a.url&&a.url.replace(/\/+$/,'')!==gh.url)throw new Error('仓库网址必须与关联的 GitHub 仓库一致');
      if(gh.prUrl&&!gh.prUrl.startsWith(gh.url+'/pull/'))throw new Error('PR 网址必须属于关联仓库');
      if(gh.prUrl&&!/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(gh.prUrl))throw new Error('PR 网址无效');
      ops.push(db.prepare('INSERT INTO task_github_workspaces(task_id,repo,branch,repo_path,repo_url,last_commit_sha,pr_url,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(task_id) DO UPDATE SET repo=excluded.repo,branch=excluded.branch,repo_path=excluded.repo_path,repo_url=excluded.repo_url,last_commit_sha=excluded.last_commit_sha,pr_url=excluded.pr_url,updated_at=excluded.updated_at').bind(a.id,gh.repo,gh.branch,gh.path,gh.url,gh.lastCommit,gh.prUrl,now));
      ops.push(eventStatement(db,owner,a.id,name==='link_github_workspace'?'github_linked':'github_snapshot_updated',{title:row.title,before,github:gh,action:a.action??'updated'},now));message=name==='link_github_workspace'?'GitHub 工作区已关联':'GitHub 版本信息已更新';
    }
  }else if(name==='add_task'){
    const t={id:crypto.randomUUID(),title:a.title,notes:a.notes??'',goal:a.goal??'',project:a.project??'',tags:a.tags??[],nextActions:a.nextActions??[],priority:a.priority??'P2',bucket:a.bucket??'today',dueDate:a.dueDate===undefined?((a.bucket??'today')==='today'?today:null):a.dueDate,estimateMin:a.estimateMin??null,status:'todo',reviewReason:null,createdAt:now,updatedAt:now,completedAt:null};
    if(t.bucket==='today' && t.dueDate && t.dueDate>today)t.bucket='upcoming';
    ops.push(db.prepare('INSERT INTO tasks(id,owner_id,title,notes,goal,project,tags_json,next_actions_json,priority,bucket,due_date,estimate_min,status,review_reason,created_at,updated_at,completed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(t.id,owner,t.title,t.notes,t.goal,t.project,JSON.stringify(t.tags),JSON.stringify(t.nextActions),t.priority,t.bucket,t.dueDate,t.estimateMin,t.status,null,now,now,null));
    const range=longTermStatement(db,t.id,a,{},today,now);if(range)ops.push(range);
    if(a.aiWorkspaceMode!==undefined||a.aiWorkspaceUrl!==undefined)ops.push(...workspaceStatements(db,t.id,a.aiWorkspaceMode??(a.aiWorkspaceUrl?'chat':'none'),a.aiWorkspaceUrl??'',a.aiWorkspaceTitle??'',now));
    ops.push(eventStatement(db,owner,t.id,'created',{title:t.title,after:t,date:today},now));message='任务已添加';
  }else if(['update_task','set_task_status','review_task'].includes(name)){
    const row=await db.prepare(taskSelect+' WHERE t.id=? AND t.owner_id=?').bind(a.id,owner).first<RecordData>();if(!row)throw new Error('任务不存在');
    const t=taskFromRow(row),before=structuredClone(t);t.updatedAt=now;
    if(name==='update_task'){
      for(const k of Object.keys(fields))if(a[k]!==undefined)t[k]=a[k];
      if(Object.keys(longFields).some(k=>a[k]!==undefined)){
        const range=longTermStatement(db,t.id,a,t,today,now);if(range)ops.push(range);
        if(['aiWorkspaceMode','aiWorkspaceUrl','aiWorkspaceTitle'].some(k=>a[k]!==undefined))ops.push(...workspaceStatements(db,t.id,a.aiWorkspaceMode??t.aiWorkspace.mode,a.aiWorkspaceUrl??t.aiWorkspace.url,a.aiWorkspaceTitle??t.aiWorkspace.title,now));
      }
      if(a.status!==undefined){t.status=a.status;t.completedAt=a.status==='done'?(t.completedAt??now):null;}
      // A bucket without a date should have coherent scheduling.
      if(a.bucket==='today' && a.dueDate===undefined)t.dueDate=today;
      if(t.bucket==='today' && t.dueDate && t.dueDate>today)t.bucket='upcoming';
    }else if(name==='set_task_status'){
      t.status=a.status;t.reviewReason=a.reason??t.reviewReason;t.completedAt=a.status==='done'?(t.completedAt??now):null;
    }else{
      const s=await buildState(db,owner,today);if(s.dayInfo.isRestDay)throw new Error('休息日无需未完成任务复盘');
      if(t.status==='done'||t.status==='dropped')throw new Error('该任务已经处理');
      t.reviewReason=a.reason??a.decision;t.completedAt=null;
      if(a.decision==='tomorrow'){t.status='todo';t.bucket='upcoming';t.dueDate=a.newDueDate??tomorrow(today);}
      if(a.decision==='deferred'){t.status='deferred';t.bucket=a.newDueDate?'upcoming':'backlog';t.dueDate=a.newDueDate??null;}
      if(a.decision==='dropped'){t.status='dropped';t.bucket='backlog';}
      if(a.decision==='blocked')t.status='blocked';
    }
    ops.push(updateStatement(db,owner,t));
    ops.push(eventStatement(db,owner,t.id,name==='review_task'?'reviewed':name==='set_task_status'?(t.status==='done'?'completed':'status_changed'):'updated',{title:t.title,before,after:t,from:{status:before.status,bucket:before.bucket,dueDate:before.dueDate},to:{status:t.status,bucket:t.bucket,dueDate:t.dueDate},status:t.status,date:today,decision:a.decision??null,reason:a.reason??null,note:a.note??''},now));message='任务已保存';
  }else if(name==='save_daily_report'){
    ops.push(db.prepare('INSERT INTO daily_reports(id,owner_id,report_date,content,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner_id,report_date) DO UPDATE SET content=excluded.content,updated_at=excluded.updated_at').bind(crypto.randomUUID(),owner,a.date,a.content,now,now));
    ops.push(eventStatement(db,owner,null,'daily_report_saved',{date:a.date,chars:a.content.length},now));message='复盘报告已保存';
  }else if(name==='set_day_mode'){
    ops.push(a.mode==='default'?db.prepare('DELETE FROM app_settings WHERE owner_id=? AND setting_key=?').bind(owner,'day:'+a.date):settingStatement(db,owner,'day:'+a.date,a.mode,now));
    ops.push(eventStatement(db,owner,null,'day_mode_changed',{date:a.date,mode:a.mode},now));message='单日模式已保存';
  }else if(name==='set_weekly_rest_days'){
    const days=[...new Set(a.days)].sort();ops.push(settingStatement(db,owner,'weekly_rest_days',days,now));ops.push(eventStatement(db,owner,null,'weekly_rest_days_changed',{days},now));message='固定休息日已保存';
  }
  if(ops.length)await db.batch(ops);
  return {content:[{type:'text',text:message}],structuredContent:await buildState(db,owner,today)};
}
