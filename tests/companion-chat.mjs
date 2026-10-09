import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const script=readFileSync('companion/chat.js','utf8');
const url='https://chatgpt.com/c/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
async function scenario({existing=false,includeMessage=true}={}){
  const messages=[],user={innerText:'Task context',textContent:'Task context',getClientRects:()=>[{}]},errors=[];
  let clock=0,finish;const done=new Promise(resolve=>{finish=resolve;});
  const job={mode:'chat',existing:existing?url:'',prompt:existing?'':'Task context',sent:!existing,delivered:false};
  const users=includeMessage?[user]:[];
  const context={location:{href:url},URL,Date:{now:()=>clock},setInterval(){},setTimeout(fn,ms){clock+=ms;queueMicrotask(fn);},window:{},
    document:{addEventListener(){},querySelectorAll(selector){if(selector==='[data-message-author-role="user"]')return users;if(selector.includes('[data-message-author-role],'))return users;return [];},getElementById(){return null;},createElement(){throw new Error('Unexpected notice');}},
    chrome:{runtime:{async sendMessage(message){messages.push(message);if(message.type==='get_job')return {job};if(message.type==='bound')finish();return {};}}}
  };
  vm.runInNewContext(script,context);
  let timeout;await Promise.race([done,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Did not bind')),1000);})]).catch(e=>errors.push(e)).finally(()=>clearTimeout(timeout));
  assert.equal(errors.length,0);
  return messages;
}
let messages=await scenario();
assert.ok(messages.some(m=>m.type==='delivered'),'Recognize the task message already in the DOM after a full navigation');
assert.equal(messages.filter(m=>m.type==='bound').length,1);
assert.equal(messages.find(m=>m.type==='bound').url,url);
assert.ok(!messages.some(m=>m.type==='consumed'),'Never send the first context again after reload');
messages=await scenario({existing:true});
assert.ok(messages.some(m=>m.type==='bound'));
assert.ok(!messages.some(m=>m.type==='consumed'||m.type==='delivered'),'Opening an existing conversation sends no extra context');
console.log('PASS: conversation binding after first-message document reload, no duplicate task message, existing conversation reopening.');
