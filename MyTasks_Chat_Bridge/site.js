window.addEventListener('message',event=>{
  if(event.source!==window||event.origin!==location.origin)return;
  const m=event.data;if(m?.channel!=='mytasks-companion'||typeof m.nonce!=='string'||m.nonce.length>100)return;
  if(m.type==='ping')window.postMessage({channel:'mytasks-companion',type:'pong',nonce:m.nonce},location.origin);
  if(m.type==='start'||m.type==='saved'){
    chrome.runtime.sendMessage({type:m.type,nonce:m.nonce,payload:m.payload}).then(r=>{if(r?.error)window.postMessage({channel:'mytasks-companion',type:'state',state:'error',nonce:m.nonce,message:r.error},location.origin)}).catch(()=>window.postMessage({channel:'mytasks-companion',type:'state',state:'error',nonce:m.nonce,message:'扩展刚刚更新，请刷新此页后重试。'},location.origin));
  }
});
chrome.runtime.onMessage.addListener(message=>{
  if(message.type!=='state')return;
  window.postMessage({channel:'mytasks-companion',...message},location.origin);
});
