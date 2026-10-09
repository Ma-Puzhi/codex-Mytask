import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import vm from 'node:vm';
import ts from 'typescript';
import { pathToFileURL } from 'node:url';
mkdirSync('.sites-runtime/legacy-tests',{recursive:true});
for(const file of ['task-launch','task-service']){
  const source=readFileSync('app/'+file+'.ts','utf8').replace("'./task-launch'","'./task-launch.mjs'");
  writeFileSync('.sites-runtime/legacy-tests/'+file+'.mjs',ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
}
const {executeTool,buildState}=await import(pathToFileURL(process.cwd()+'/.sites-runtime/legacy-tests/task-service.mjs'));

// Exercise the production SQL against SQLite using D1's prepared/batch interface.
const sql = new DatabaseSync(':memory:');
sql.exec('PRAGMA foreign_keys=ON');
const migrations = readdirSync(new URL('../drizzle/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort();
sql.exec(readFileSync(new URL('../drizzle/'+migrations[0],import.meta.url),'utf8'));
const db = {
  prepare(query) {
    let args=[];
    const prepared={bind(...values){args=values;return prepared},
      async first(){return sql.prepare(query).get(...args)??null},
      async all(){return {results:sql.prepare(query).all(...args)}},
      execute(){const stmt=sql.prepare(query);return {results:stmt.columns().length?stmt.all(...args):(stmt.run(...args),[])}}};
    return prepared;
  },
  async batch(ops){sql.exec('BEGIN');try{const results=ops.map(o=>o.execute());sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}},
};
const owner='owner-a', today='2026-10-08', at='2026-10-08T01:00:00Z';
sql.prepare('INSERT INTO tasks(id,owner_id,title,created_at,updated_at) VALUES(?,?,?,?,?)').run('original',owner,'Original task',at,at);
sql.prepare('INSERT INTO daily_reports(id,owner_id,report_date,content,created_at,updated_at) VALUES(?,?,?,?,?,?)').run('report',owner,today,'Original report',at,at);
sql.prepare('INSERT INTO task_events(id,owner_id,task_id,event_type,created_at) VALUES(?,?,?,?,?)').run('original-event',owner,'original','created',at);
sql.prepare('INSERT INTO app_settings(owner_id,setting_key,value_json,updated_at) VALUES(?,?,?,?)').run(owner,'weekly_rest_days','[4]',at);
const originalTables=['tasks','task_events','daily_reports','app_settings'];
const original=originalTables.map(t=>sql.prepare('SELECT * FROM '+t).all());
const delta=readFileSync(new URL('../drizzle/'+migrations[1],import.meta.url),'utf8');
assert(!/^\s*(?:DROP|ALTER|DELETE)\s/im.test(delta));
sql.exec(delta);sql.exec(delta);
assert.deepEqual(originalTables.map(t=>sql.prepare('SELECT * FROM '+t).all()),original,'Repeat-safe upgrade preserves existing records');

for(const file of migrations.slice(2))sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
assert.deepEqual(originalTables.map(t=>sql.prepare('SELECT * FROM '+t).all()),original,'V2.1 migration preserves all original data');
const call=(name,args,asOwner=owner)=>executeTool(db,asOwner,name,args);
await call('link_github_workspace',{id:'original',repo:'https://github.com/example/research.git',branch:'exp/rolling',path:'/mytask/rolling/',today});
let state=await buildState(db,owner,today);
assert.equal(state.tasks[0].github.repo,'example/research');
assert.equal(state.tasks[0].github.path,'mytask/rolling');
assert.equal(state.dayInfo.isRestDay,true);
assert.equal(state.stats.openToday,0);
assert.equal(state.reports[0].content,'Original report');
assert.equal((await buildState(db,'owner-b',today)).tasks.length,0);
for(const tool of ['link_github_workspace','update_github_snapshot','unlink_github_workspace']){
  await assert.rejects(call(tool,{id:'original',repo:'example/other',lastCommit:'abcdef123',today},'owner-b'),/任务不存在/);
}
await call('update_github_snapshot',{id:'original',lastCommit:'abcdef123456',prUrl:'https://github.com/example/research/pull/3',action:'commit succeeded',today});
await call('link_github_workspace',{id:'original',repo:'example/research',branch:'exp/rolling',path:'mytask/rolling',today});
state=await buildState(db,owner,today);
assert.equal(state.tasks[0].github.lastCommit,'abcdef123456','Editing an existing association preserves its recorded snapshot');
assert.equal(state.tasks[0].status,'todo','Recording a snapshot does not prematurely complete the task');
assert.equal(state.tasks[0].github.prUrl,'https://github.com/example/research/pull/3');
await assert.rejects(call('update_github_snapshot',{id:'original',prUrl:'javascript:alert(1)'}),/PR/);
await assert.rejects(call('link_github_workspace',{id:'original',repo:'example/research',path:'../private'}),/目录/);
await assert.rejects(call('link_github_workspace',{id:'original',repo:'example/research',branch:'bad..branch'}),/分支/);
await call('unlink_github_workspace',{id:'original',today});
assert.equal((await buildState(db,owner,today)).tasks[0].github.repo,'');
assert.equal(sql.prepare('SELECT count(*) n FROM tasks').get().n,1);
await assert.rejects(call('update_github_snapshot',{id:'original',lastCommit:'abcdef123'}),/先关联/);
assert.equal(sql.prepare('SELECT content FROM daily_reports').get().content,'Original report');
assert.equal(sql.prepare('SELECT count(*) n FROM task_events WHERE id=?').get('original-event').n,1);


await call('add_task',{title:'Long experiment',taskType:'long_term',startDate:today,durationDays:14,bucket:'upcoming',dueDate:null,today});
state=await buildState(db,owner,today);const long=state.tasks.find(t=>t.title==='Long experiment');
assert.equal(long.endDate,'2026-10-21');assert.equal(long.durationDays,14);
await call('save_task_day_entry',{id:long.id,date:today,plan:'Train',workLog:'Baseline ready',blockers:'GPU busy',nextPlan:'Compare'});
await call('save_task_day_entry',{id:long.id,date:today,workLog:'Training finished'});
await call('save_task_day_plans',{id:long.id,plans:[{date:today,plan:'Updated plan'},{date:'2026-10-09',plan:'Evaluate'}],today});
let timeline=(await call('get_task_timeline',{id:long.id})).structuredContent.task;
assert.equal(timeline.entries.length,2);assert.equal(timeline.entries[1].workLog,'Training finished');assert.equal(timeline.entries[1].blockers,'GPU busy');
await call('set_task_ai_workspace',{id:'original',mode:'chat',url:'https://chatgpt.com/c/task-a-11111',title:'A',today});
await call('set_task_ai_workspace',{id:long.id,mode:'work',url:'https://chatgpt.com/c/task-b-22222',title:'B',today});
state=await buildState(db,owner,today);assert.equal(state.tasks.find(t=>t.id==='original').aiWorkspace.url,'https://chatgpt.com/c/task-a-11111');assert.equal(state.tasks.find(t=>t.id===long.id).aiWorkspace.mode,'work');
await call('set_task_ai_workspace',{id:'original',mode:'none',today});
assert.equal((await buildState(db,owner,today)).tasks.find(t=>t.id==='original').aiWorkspace.mode,'none');
await assert.rejects(call('set_task_ai_workspace',{id:long.id,mode:'chat',url:'javascript:alert(1)'}));
await assert.rejects(call('set_task_ai_workspace',{id:long.id,mode:'chat',url:'https://evil.example/'}));
await call('set_local_git_workspace',{id:long.id,localPath:'/home/me/research',repository:'experiment',remoteUrl:'https://github.com/example/experiment',lastCommit:'abcdef123',today});
await call('set_local_git_workspace',{id:long.id,branch:'exp/test',today});
assert.equal((await buildState(db,owner,today)).tasks.find(t=>t.id===long.id).localGit.lastCommit,'abcdef123');
for(const name of ['get_task_timeline','set_task_ai_workspace','set_local_git_workspace','save_task_day_entry','save_task_day_plans'])await assert.rejects(call(name,{id:long.id,mode:'none',date:today,plans:[]},'owner-b'),/任务不存在/);
await call('update_task',{id:long.id,taskType:'single',today});
assert.equal((await call('get_task_timeline',{id:long.id})).structuredContent.task.entries.length,2,'Changing type preserves daily history');
assert.equal(sql.prepare('SELECT content FROM daily_reports WHERE id=?').get('report').content,'Original report');
const html=readFileSync(new URL('../app/dashboard.html',import.meta.url),'utf8').replace('"__MYTASK_SITE_ORIGIN__"','"https://mytask.example"');
assert(!html.includes('ui/message'));assert(!html.includes('ui/update-model-context'));assert(!html.includes('PREVIEW'));
const between=(start,end)=>html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)));
const uiTasks=[{id:'a',title:'Task A',aiSessions:{chat:{url:'https://chatgpt.com/c/aaaaaaaa'}}},{id:'b',title:'Task B',aiSessions:{work:{url:'https://chatgpt.com/c/bbbbbbbb'}}},{id:'none',title:'New task',aiSessions:{}}];
const opened=[],details=[],toasts=[],externals=[];let dialogs=0;
const elements={'#discuss-task-title':{},'#discuss-binding-state':{},'#discuss-new':{},'#task-discuss-dialog':{showModal(){dialogs++;}}};
const ctx=vm.createContext({URL,URLSearchParams,console:{warn(){},error(){}},state:{tasks:uiTasks},selectedTaskId:'preserved',currentView:'today',STANDALONE:true,hostCapabilities:{},$:selector=>elements[selector],openDetail:id=>details.push(id),toast:text=>toasts.push(text),window:{open:()=>({set opener(v){},location:{replace:url=>opened.push(url)}})}});
vm.runInContext(between('function repositoryInfo','function renderDetail'),ctx);
vm.runInContext(between('function validWorkspaceUrl','async function saveTaskWorkspace'),ctx);
vm.runInContext(between('async function openTaskWorkspace','async function saveDayEntry'),ctx);
await vm.runInContext("openTaskWorkspace('a')",ctx);assert.equal(elements['#discuss-task-title'].textContent,'Task A');
await vm.runInContext("openTaskWorkspace('b')",ctx);assert.equal(elements['#discuss-task-title'].textContent,'Task B');
await vm.runInContext("openTaskWorkspace('none')",ctx);
assert.equal(dialogs,3);assert.deepEqual(opened,[],'Choosing a task first asks Chat or Work');assert.deepEqual(details,[]);
assert.equal(ctx.selectedTaskId,'preserved');assert.equal(ctx.currentView,'today');
await vm.runInContext("launchTask(state.tasks[0],'chat')",ctx);
await vm.runInContext("launchTask(state.tasks[1],'work')",ctx);
assert.equal(new URL(opened[0]).searchParams.get('id'),'a');assert.equal(new URL(opened[0]).searchParams.get('mode'),'chat');
assert.equal(new URL(opened[1]).searchParams.get('id'),'b');assert.equal(new URL(opened[1]).searchParams.get('mode'),'work');
assert.equal(await vm.runInContext("openWorkspaceUrl('https://github.com/example/repo',true)",ctx),true);assert.equal(opened.at(-1),'https://github.com/example/repo');
ctx.window.open=()=>null;assert.equal(await vm.runInContext("launchTask(state.tasks[0],'chat')",ctx),false);
assert.equal(opened.length,3,'Popup blocking never navigates the current page');
ctx.STANDALONE=false;ctx.hostCapabilities.openLinks=true;ctx.rpcRequest=async()=>{throw new Error('unsupported')};
ctx.window.openai={openExternal:async options=>externals.push(options)};
assert.equal(await vm.runInContext("launchTask(state.tasks[0],'work',{forceNew:true})",ctx),true);
assert.equal(new URL(externals[0].href).searchParams.get('new'),'1');assert.equal(externals[0].redirectUrl,false,'Host fallback still opens externally');
let contentClick;ctx.$=()=>({addEventListener:(event,handler)=>{if(event==='click')contentClick=handler}});
vm.runInContext(html.split('\n').find(l=>l.startsWith('$("#content").addEventListener("click"')),ctx);
await contentClick({target:{closest:selector=>selector==='[data-open-detail]'?{closest:()=>({dataset:{id:'a'}})}:null}});
assert.equal(details.at(-1),'a','Ellipsis opens details without opening a workspace');
sql.close();console.log('Passed: non-destructive migrations, existing records, owner isolation, reports/rest days, daily logs and plans, independent workspaces, Work Git metadata, None mode, Chat/Work choice, host and popup fallback, preserved view and details routing.');
