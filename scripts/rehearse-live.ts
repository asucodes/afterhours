export {};
const root='http://127.0.0.1:3001';
async function api(path:string,method='GET',body?:unknown){const res=await fetch(root+path,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await res.json();if(!res.ok)throw new Error(data.error||String(res.status));return data;}
const original=await api('/api/cases/1690fa92-4067-473b-8faa-006ec1770aeb');
const c=await api('/api/cases','POST',{prompt:original.prompt});
await api(`/api/cases/${c.id}/brief`,'PATCH',{expectedVersion:c.version,brief:{...original.brief,title:process.argv.includes('--warm')?'QA warm-cache rehearsal · bread vendor sourcing':'QA live rehearsal · bread vendor sourcing'}});
await api(`/api/cases/${c.id}/start`,'POST');
console.log(JSON.stringify({caseId:c.id,stage:'started',note:'Fresh live model calls; existing provider responses are reused only on exact cache matches.'}));
const began=Date.now();let prior='';
while(Date.now()-began<360000){const current=await api(`/api/cases/${c.id}`);const state=`${current.status}:${current.tasks.filter((t:any)=>t.status==='done').length}:${current.evidence.length}`;if(state!==prior){console.log(JSON.stringify({status:current.status,completedTasks:current.tasks.filter((t:any)=>t.status==='done').length,records:current.evidence.length}));prior=state;}if(['complete','error','needs_input'].includes(current.status)){const trace=await api(`/api/crustdata/requests?caseId=${c.id}`);console.log(JSON.stringify({caseId:c.id,status:current.status,currentDocuments:current.artifacts.filter((a:any)=>a.state==='current'&&a.version===current.version).length,counts:trace.counts,elapsedSeconds:Math.round((Date.now()-began)/1000),error:current.error}));process.exit(0);}await new Promise(r=>setTimeout(r,2000));}
console.log(JSON.stringify({caseId:c.id,stage:'still-running',note:'Research continues on the local backend.'}));
