import { dashboardHtml as dashboard } from './site-config';
export function GET(request:Request){
 if(!request.headers.get('oai-authenticated-user-id'))return Response.redirect(new URL('/signin-with-chatgpt?return_to=%2F',request.url),302);
 return new Response(dashboard,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
