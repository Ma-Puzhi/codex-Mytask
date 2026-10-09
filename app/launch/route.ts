import launchHtml from '../launch-html';

export function GET(request:Request){
  const url=new URL(request.url);
  if(!request.headers.get('oai-authenticated-user-id')){
    return Response.redirect(new URL('/signin-with-chatgpt?return_to='+encodeURIComponent(url.pathname+url.search),url),302);
  }
  return new Response(launchHtml,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
