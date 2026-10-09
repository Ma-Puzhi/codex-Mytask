import { env } from 'cloudflare:workers';
import { executeTool } from '../../../task-service';
export async function POST(request:Request,context:{params:Promise<{name:string}>}){
  const owner=request.headers.get('oai-authenticated-user-id');
  if(!owner)return Response.json({error:'请先登录'},{status:401});
  const origin=request.headers.get('origin');if(origin && origin!==new URL(request.url).origin)return Response.json({error:'来源无效'},{status:403});
  try{if(!env.DB)throw new Error('暂时无法访问任务数据');const {name}=await context.params;return Response.json(await executeTool(env.DB,owner,name,await request.json()),{headers:{'Cache-Control':'no-store'}});}
  catch(error){console.error('Task operation failed',error);return Response.json({error:error instanceof Error?error.message:'保存失败，请稍后重试'},{status:400});}
}
