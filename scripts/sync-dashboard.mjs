import {readFileSync,writeFileSync} from 'node:fs';
for(const [name,variable] of [['dashboard','dashboard'],['launch','launchHtml']]){
  const html=readFileSync(new URL('../app/'+name+'.html',import.meta.url),'utf8');
  writeFileSync(new URL('../app/'+name+'-html.ts',import.meta.url),'const '+variable+' = '+JSON.stringify(html)+';\nexport default '+variable+';\n');
}
