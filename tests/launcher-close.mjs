import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const script=readFileSync('app/launch.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const origin='https://mytask.example';
const url='https://chatgpt.com/c/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

async function scenario({alreadyBound=false,failSave=false}={}){
  const listeners=new Set(),calls=[],order=[],elements={};
  let closeCount=0,finished;
  const done=new Promise(resolve=>{finished=resolve;});
  const element=selector=>elements[selector]||(elements[selector]={style:{},setAttribute(){},set textContent(value){this.text=value;if(value.includes('保存失败'))finished();},get textContent(){return this.text;}});
  const window={
    addEventListener(type,fn){if(type==='message')listeners.add(fn);},
    removeEventListener(type,fn){if(type==='message')listeners.delete(fn);},
    postMessage(message,target){
      assert.equal(target,origin);
      if(message.type==='saved')order.push('saved');
      const reply=message.type==='ping'?{...message,type:'pong'}:message.type==='start'?{channel:'mytasks-companion',type:'state',state:'bound',nonce:message.nonce,url}:null;
      if(reply)queueMicrotask(()=>{for(const listener of [...listeners])listener({source:window,origin,data:reply});});
    },
    close(){closeCount++;order.push('close');finished();},
  };
  const context={window,document:{querySelector:element},location:{origin,search:'?id=task-a&mode=work'},URL,URLSearchParams,crypto:{randomUUID:()=> 'launcher-nonce'},
    setInterval,clearInterval,clearTimeout,setTimeout:(fn,ms)=>setTimeout(fn,ms===400?0:ms),
    async fetch(path){
      calls.push(path);
      if(path.endsWith('get_task_launch'))return {ok:true,async json(){return {structuredContent:{id:'task-a',title:'Task A',mode:'work',url:alreadyBound?url:'',prompt:'',newPrompt:'Task context'}};}};
      assert.ok(path.endsWith('set_task_ai_workspace'));
      if(failSave)throw new Error('offline');
      order.push('persist');return {ok:true,async json(){return {structuredContent:{}};}};
    },
  };
  vm.runInNewContext(script,context);
  let timeout;
  await Promise.race([done,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Launcher did not finish')),3000);})]).finally(()=>clearTimeout(timeout));
  return {calls,order,closeCount,elements};
}
let result=await scenario();
assert.deepEqual(result.order,['persist','saved','close'],'New binding must persist before the launcher closes');
assert.equal(result.closeCount,1);
result=await scenario({alreadyBound:true});
assert.deepEqual(result.order,['saved','close'],'Existing binding can close without another database write');
assert.equal(result.calls.length,1);
result=await scenario({failSave:true});
assert.equal(result.closeCount,0);assert.ok(!result.order.includes('saved'));assert.equal(result.elements['#error'].style.display,'block');
console.log('PASS: close after successful save, immediate close for existing binding, preserve launcher on failed save.');
