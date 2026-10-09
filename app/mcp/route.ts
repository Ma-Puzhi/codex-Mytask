import { env } from 'cloudflare:workers';
import { dashboardHtml as dashboard, siteOrigin } from '../site-config';
import { executeTool } from '../task-service';
const URI='ui://my-tasks/dashboard';
const str={type:'string'},date={type:'string',pattern:'^\\d{4}-\\d{2}-\\d{2}$'},nullableDate={anyOf:[date,{type:'null'}]};
const editable={title:{...str,minLength:1,maxLength:240},notes:{...str,maxLength:5000},goal:{...str,maxLength:3000},project:{...str,maxLength:120},tags:{type:'array',items:{...str,minLength:1,maxLength:60},maxItems:12},nextActions:{type:'array',items:{...str,minLength:1,maxLength:500},maxItems:20},priority:{type:'string',enum:['P1','P2','P3','P4']},bucket:{type:'string',enum:['today','upcoming','backlog']},dueDate:nullableDate,estimateMin:{anyOf:[{type:'integer',minimum:0,maximum:100000},{type:'null'}]}};
const status={type:'string',enum:['todo','in_progress','done','deferred','dropped','blocked']};
const longFields={taskType:{type:'string',enum:['single','long_term']},startDate:nullableDate,endDate:nullableDate,durationDays:{anyOf:[{type:'integer',minimum:1,maximum:3650},{type:'null'}]},aiWorkspaceMode:{type:'string',enum:['none','chat','work']},aiWorkspaceUrl:{...str,maxLength:3000},aiWorkspaceTitle:{...str,maxLength:240}};
const specs:[string,string,string,Record<string,unknown>,string[],boolean][]=[
 ['open_tasks','My Tasks','打开每日任务、晚间复盘和休息日工作台',{},[],true],
 ['get_tasks','读取任务','读取当前任务、复盘报告、休息日设置和最近历史',{today:date},[],true],
 ['add_task','添加任务','添加用户明确要求的单次或长期任务',{...editable,...longFields,today:date},['title'],false],
 ['update_task','修改任务','编辑任务内容、长期日期范围、下一步行动或状态',{id:str,...editable,...longFields,status,today:date},['id'],false],
 ['set_task_status','修改任务状态','完成、重新打开或变更任务状态',{id:str,status,reason:{anyOf:[str,{type:'null'}]},today:date},['id','status'],false],
 ['review_task','复盘未完成任务','记录明天补上、主动延期、暂时不需要或被阻塞的决定',{id:str,decision:{type:'string',enum:['tomorrow','deferred','dropped','blocked']},reason:{type:'string',enum:['forgot_or_no_time','intentional','not_needed','blocked']},note:str,today:date,newDueDate:nullableDate},['id','decision','today'],false],
 ['save_daily_report','保存复盘报告','仅保存用户撰写或明确编辑的复盘报告，不自动生成或覆盖',{date,content:{...str,maxLength:20000}},['date','content'],false],
 ['set_day_mode','设置单日模式','指定日期按默认规则、工作日或休息日处理',{date,mode:{type:'string',enum:['default','rest','work']}},['date','mode'],false],
 ['set_weekly_rest_days','设置固定休息日','设置每周休息日，0是周日、6是周六',{days:{type:'array',items:{type:'integer',minimum:0,maximum:6},maxItems:7},today:date},['days'],false],
 ['get_task_history','读取任务历史','读取最近的操作历史，可指定一个任务',{id:str,limit:{type:'integer',minimum:1,maximum:200}},[],true],
 ['set_task_repository_link','保存任务仓库链接','保存用户提供的仓库网页链接；只用于点击打开，不创建仓库、不提交或上传文件。url 为空时清除链接',{id:str,url:{...str,maxLength:2000},today:date},['id','url'],false],
 ['set_task_ai_workspace','设置任务 AI 工作区','保存任务对应的 ChatGPT / Work / None 和独立 URL，不调用 OpenAI API',{id:str,mode:{type:'string',enum:['none','chat','work']},url:{...str,maxLength:3000},title:{...str,maxLength:240},today:date},['id','mode'],false],
 ['set_task_chat_link','保存任务对话链接','兼容旧版本：绑定任务对应的 ChatGPT 对话 URL',{id:str,chatUrl:{...str,maxLength:3000},today:date},['id'],false],
 ['save_task_day_entry','保存每日进展','保存长期任务指定日期的计划、实际进展、问题和下一步，保留其他日期记录',{id:str,date,plan:{...str,maxLength:5000},workLog:{...str,maxLength:10000},blockers:{...str,maxLength:5000},nextPlan:{...str,maxLength:5000}},['id','date'],false],
 ['save_task_day_plans','保存未来计划','批量保存长期任务日期计划，保留已有工作日志和问题',{id:str,plans:{type:'array',maxItems:90,items:{type:'object',properties:{date,plan:{...str,maxLength:5000}},required:['date','plan'],additionalProperties:false}},today:date},['id','plans'],false],
 ['get_task_timeline','读取任务时间线','读取长期任务日期范围与全部每日计划、进展历史',{id:str},['id'],true],
 ['get_task_launch','准备任务专属会话','读取指定任务的聊天或 Work 绑定及任务上下文；不创建模型调用',{id:str,mode:{type:'string',enum:['chat','work']},today:date},['id','mode'],true],
];
export const mcpTools=specs.map(([name,title,description,properties,required,read])=>({name,title,description,inputSchema:{type:'object',properties,required,additionalProperties:false},annotations:{readOnlyHint:read,destructiveHint:false,openWorldHint:false},...(['get_task_history','get_task_timeline','get_task_launch'].includes(name)?{}:{_meta:{ui:{resourceUri:URI,visibility:['app','model']},'openai/outputTemplate':URI,...(name==='open_tasks'?{'openai/ui':{entrypoints:[{type:'global'},{type:'thread'}]}}:{})}})}));
export async function POST(request:Request){
 let msg:{id?:string|number|null;method:string;params?:{protocolVersion?:string;uri?:string;name?:string;arguments?:unknown}};
 try{msg=await request.json();}catch{return Response.json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}},{status:400});}
 if(!msg||typeof msg!=='object'||typeof msg.method!=='string')return Response.json({jsonrpc:'2.0',id:null,error:{code:-32600,message:'Invalid Request'}},{status:400});
 const reply=(result:unknown)=>Response.json({jsonrpc:'2.0',id:msg.id,result},{headers:{'Cache-Control':'no-store'}});
 if(msg.id===undefined)return new Response(null,{status:202});
 if(msg.method==='initialize')return reply({protocolVersion:msg.params?.protocolVersion??'2025-11-25',capabilities:{tools:{},resources:{}},serverInfo:{name:'my-tasks',title:'My Tasks',version:'2.3.2'},instructions:'任务数据来自私有数据库。只有用户明确要求时才修改任务；复盘报告仅保存用户本人撰写或授权编辑的文本。每个任务分别绑定独立聊天和 Work 会话；新标签页通过辅助扩展记录真实会话 URL。My Tasks 保持原页面。不伪造自动绑定。禁止 OpenAI API、Responses API 和单独计费模型调用。仓库功能只保存用户提供的网址并支持点击打开。使用 set_task_repository_link 将链接保存到对应任务，不要求本机目录、分支或公开性，不执行创建仓库、上传、提交、推送等 Git 操作。'});
 if(msg.method==='ping')return reply({});
 if(msg.method==='tools/list')return reply({tools:mcpTools});
 if(msg.method==='resources/list')return reply({resources:[{uri:URI,name:'My Tasks',mimeType:'text/html;profile=mcp-app'}]});
 if(msg.method==='resources/templates/list')return reply({resourceTemplates:[]});
 if(msg.method==='resources/read'){
  if(msg.params?.uri!==URI)return Response.json({jsonrpc:'2.0',id:msg.id,error:{code:-32602,message:'Unknown resource'}});
  return reply({contents:[{uri:URI,mimeType:'text/html;profile=mcp-app',text:dashboard,_meta:{ui:{csp:{connectDomains:[],resourceDomains:[]}},'openai/widgetCSP':{redirect_domains:[siteOrigin,'https://chatgpt.com','https://github.com','https://gitlab.com','https://gitee.com','https://bitbucket.org']},'openai/ui':{preferredDisplayMode:'fullscreen',availableDisplayModes:['inline','fullscreen']},'openai/widgetPrefersBorder':false}}]});
 }
 if(msg.method==='tools/call'){
  const owner=request.headers.get('oai-authenticated-user-id');if(!owner)return Response.json({jsonrpc:'2.0',id:msg.id,error:{code:-32001,message:'Authentication required'}},{status:401});
  try{if(!env.DB)throw new Error('数据暂时不可用');return reply(await executeTool(env.DB,owner,msg.params?.name??'',msg.params?.arguments??{}));}
  catch(error){console.error('MCP task operation failed',error);return reply({isError:true,content:[{type:'text',text:error instanceof Error?error.message:'操作失败'}]});}
 }
 return Response.json({jsonrpc:'2.0',id:msg.id,error:{code:-32601,message:'Method not found'}});
}
export function GET(){return new Response(null,{status:405,headers:{Allow:'POST'}});}
