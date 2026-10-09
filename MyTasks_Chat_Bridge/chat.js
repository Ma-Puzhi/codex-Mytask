(() => {
  const send=message=>chrome.runtime.sendMessage(message).catch(()=>({}));
  const conversation=value=>{try{const u=new URL(value);return /\/(?:c|work|tasks)\/[a-zA-Z0-9_-]{8,}(?:\/|$)/.test(u.pathname)?u.origin+u.pathname:'';}catch{return '';}};
  const visible=el=>!!el&&el.getClientRects().length>0;
  let deletion=null,lastUrl=location.href;
  document.addEventListener('click',event=>{
    const button=event.target.closest('button'),dialog=button?.closest('[role="dialog"],[role="alertdialog"]');
    if(dialog&&/^(删除|确认删除|Delete|Delete chat|Delete conversation)$/i.test(button.textContent.trim())&&/(delete.*(?:chat|conversation)|删除.*(?:聊天|对话|会话))/i.test(dialog.textContent)&&conversation(location.href))deletion={url:conversation(location.href),at:Date.now()};
    else if(deletion)deletion=null;
  },true);
  setInterval(()=>{if(location.href===lastUrl)return;lastUrl=location.href;if(deletion&&Date.now()-deletion.at<5000&&!conversation(location.href)){send({type:'deleted',url:deletion.url});deletion=null;}},250);
  function notice(text){let box=document.getElementById('mytasks-bridge-status');if(!box){box=document.createElement('div');box.id='mytasks-bridge-status';box.style.cssText='position:fixed;right:20px;bottom:24px;max-width:360px;z-index:2147483647;background:#246bfd;color:white;padding:12px 16px;border-radius:12px;font:14px/1.55 system-ui;box-shadow:0 6px 25px #0003';document.body.appendChild(box);}box.textContent=text;}
  function composer(){return [...document.querySelectorAll('#prompt-textarea,textarea[data-testid*="prompt"],textarea[placeholder],[contenteditable="true"][role="textbox"]')].find(visible);}
  function composerText(el){return el.tagName==='TEXTAREA'?el.value:el.innerText;}
  function fill(el,text){el.focus();if(el.tagName==='TEXTAREA'){const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(el,text);el.dispatchEvent(new Event('input',{bubbles:true}));return true;}const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(el);selection.removeAllRanges();selection.addRange(range);return document.execCommand('insertText',false,text);}
  function sendButton(el){const form=el.closest('form')||document;return [...form.querySelectorAll('button[data-testid="send-button"],button[data-testid="composer-send-button"],button[aria-label="Send prompt"],button[aria-label="Send message"],button[aria-label="发送"],button[aria-label="发送提示"],button[aria-label="发送消息"],button[type="submit"]')].find(b=>visible(b)&&!b.disabled&&b.getAttribute('aria-disabled')!=='true');}
  const normalized=text=>text.trim().replace(/\r/g,'').replace(/\n+/g,'\n').replace(/\u200b/g,'');
  function missing(){return [...document.querySelectorAll('[role="alert"],main h1,main h2,[data-testid="conversation-error"]')].some(el=>visible(el)&&/^(?:conversation (?:not found|has been deleted)|(?:this )?(?:chat|conversation) (?:was|has been) deleted|(?:找不到|未找到|已删除)(?:该|此|这个)?(?:对话|会话|聊天)|(?:对话|会话|聊天)(?:不存在|已被删除|已删除))[.。!！\s]*$/i.test(el.textContent.trim()));}
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  async function run(){
    let job;for(let i=0;i<30;i++){job=(await send({type:'get_job'})).job;if(job)break;await delay(300);}if(!job)return;
    let delivered=job.delivered||!job.prompt,clicked=job.sent,announced='',missingReported=false,warningShown=false;
    const initialUsers=new Set(document.querySelectorAll('[data-message-author-role="user"]'));
    const started=Date.now();
    while(Date.now()-started<600000){
      const url=conversation(location.href);
      if(job.existing&&missing()&&!missingReported){missingReported=true;await send({type:'missing'});return;}
      // Confirm the exact task message in the native transcript, including a manual send.
      if(!delivered&&[...document.querySelectorAll('[data-message-author-role="user"]')].some(el=>(job.sent||!job.existing||!initialUsers.has(el))&&normalized(el.innerText).includes(normalized(job.prompt)))){delivered=true;await send({type:'delivered'});}
      const existingReady=!job.existing||Date.now()-started>1800&&[...document.querySelectorAll('[data-message-author-role],[data-testid^="conversation-turn"],main article')].some(visible);
      if(url&&url!==announced&&delivered&&existingReady){announced=url;await send({type:'bound',url});}
      if(!delivered&&!clicked){
        const el=composer();
        if(el&&existingReady){const current=composerText(el).trim();if(current&&normalized(current)!==normalized(job.prompt)){notice('My Tasks：输入框已有草稿。请先处理草稿，再刷新以发送任务指令。');await send({type:'error',message:'会话输入框已有草稿，尚未发送任务指令。请处理草稿后重试。'});return;}
          const modes=[...(el.closest('form')||document).querySelectorAll('button[aria-pressed="true"],button[aria-selected="true"],button[data-state="active"]')].filter(visible).map(b=>b.textContent.trim().toLowerCase());
          if(job.mode==='work'&&modes.some(m=>m==='chat'||m==='聊天')&&!modes.includes('work')){notice('My Tasks：请先把这个会话切换为 Work，再刷新。');await send({type:'error',message:'当前页面选择了聊天。请切换为 Work 后重试，任务上下文尚未发送。'});return;}
          if(!current&&!fill(el,job.prompt)){notice('My Tasks：网页输入控件已变化，请手动粘贴任务上下文后发送。');await send({type:'error',message:'网页输入控件未能自动填入，请使用手动打开并绑定。'});return;}
          await delay(400);const button=sendButton(el);
          if(button){await send({type:'consumed'});button.click();clicked=true;notice('My Tasks：正在确认任务上下文已发送…');}
        }
      }
      if(delivered&&announced){document.getElementById('mytasks-bridge-status')?.remove();return;}
      if(Date.now()-started>45000&&!warningShown){warningShown=true;notice('My Tasks：请完成登录或在输入框发送任务上下文；发送后会自动绑定。');await send({type:'error',message:'等待登录或确认发送消息。请保留新打开的 ChatGPT 标签页，首次发送后会自动绑定。'});}
      await delay(700);
    }
  }
  run().catch(()=>notice('My Tasks：自动操作暂时未完成，请保留会话页并重试。'));
})();
