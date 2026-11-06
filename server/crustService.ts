import type {CrustTrace,CrustAttempt} from '../shared/crustTrace';
import type {Role} from '../shared/types';
import {responsePreview,sanitizeTrace,scrubText} from './traceSafety';
export const CRUST_TOOLS=['company_search','company_identify','company_enrich','person_search','web_search_live','web_enrich_live','account_credits'] as const;
export interface CrustContext{requestId?:string;caseId?:string;version?:number;role?:Role;}
interface Deps{connect:()=>Promise<{callTool:(...args:any[])=>Promise<any>}>;reset:()=>void;wait:()=>Promise<void>;cacheGet:(key:string)=>unknown;cacheSet:(key:string,value:unknown)=>void;record:(trace:CrustTrace)=>void;secrets:()=>string[];sleep?:(ms:number)=>Promise<void>;now?:()=>number;}
export function retryable(error:unknown){const e=error as {status?:number;message?:string};if(e.status===401||e.status===403||e.status===400||e.status===404)return false;return e.status===429||!!e.status&&e.status>=500||/timeout|timed out|abort|connection|closed|econn|fetch failed|transport|session|429|50[0234]/i.test(e.message||String(error));}
function decode(r:any){if(r.isError)throw new Error('Crustdata returned a tool error.');if(r.structuredContent)return r.structuredContent;const text=(r.content||[]).filter((x:any)=>x.type==='text').map((x:any)=>x.text).join('\n');try{return JSON.parse(text);}catch{return {text};}}
export function createCrustService(deps:Deps){
 const now=deps.now||Date.now,sleep=deps.sleep||((ms:number)=>new Promise<void>(r=>setTimeout(r,ms)));
 async function request(tool:string,params:Record<string,unknown>,onCache?:()=>void,context:CrustContext={},method:'execute'|'get_schema'='execute'){
  if(method==='execute'&&!CRUST_TOOLS.includes(tool as any))throw new Error('Tool is not permitted in this workspace.');
  const began=now(),secrets=deps.secrets();
  const trace:CrustTrace={id:context.requestId||crypto.randomUUID(),caseId:context.caseId,version:context.version,role:context.role,tool,method,endpoint:'https://install.crustdata.com/mcp',startedAt:new Date(began).toISOString(),status:'queued',params:sanitizeTrace(params,secrets),attempts:[]};
  const persist=()=>deps.record(structuredClone(trace));
  const finish=(status:CrustTrace['status'],result?:unknown)=>{trace.status=status;trace.finishedAt=new Date(now()).toISOString();trace.durationMs=now()-began;if(result!==undefined)Object.assign(trace,responsePreview(result,secrets));persist();};
  persist();const key=JSON.stringify([tool,params]);
  const cached=method==='execute'&&tool!=='account_credits'?deps.cacheGet(key):undefined;
  if(cached!==undefined){const data=(cached as any)?.value!==undefined?(cached as any).value:cached;onCache?.();finish('cached',data);return data;}
  for(let n=1;n<=3;n++){
   await deps.wait();const start=now();const attempt:CrustAttempt={number:n,startedAt:new Date(start).toISOString(),sent:false,status:'running'};trace.attempts.push(attempt);trace.status='running';persist();
   try{
    const client=await deps.connect();attempt.sent=true;persist();
    const code=`// model query: AfterHours launch agency research using ${tool}\nconst r = await callTool(${JSON.stringify(tool)}, inputs.params); if (!r.ok) return { afterhoursError: true, status: r.status, message: r.message }; return r.data;`;
    const rpc=await client.callTool({name:method,arguments:method==='execute'?{code,inputs:{params},maxOutputBytes:45000}:params},undefined,{timeout:120000});Object.assign(trace,responsePreview(rpc,secrets));const result=decode(rpc);
    if(result.ok===false)throw new Error(`Crustdata execution failed: ${typeof result.error==='string'?result.error:JSON.stringify(result.error||result.message||'Check account access.')}`);
    const data=result.value??result.result??result.output??result;
    if(data?.afterhoursError){const error=new Error(`Crustdata ${tool}: ${String(data.message||'Request failed').slice(0,200)}`) as Error&{status?:number};error.status=Number(data.status)||undefined;throw error;}
    attempt.status='succeeded';attempt.finishedAt=new Date(now()).toISOString();attempt.durationMs=now()-start;
    if(method==='execute'&&tool!=='account_credits')deps.cacheSet(key,data);
    finish('succeeded',data);return data;
   }catch(error){attempt.status='failed';attempt.finishedAt=new Date(now()).toISOString();attempt.durationMs=now()-start;attempt.error=scrubText(error instanceof Error?error.message:String(error),secrets).slice(0,600);
    if(n===3||!retryable(error)){trace.error=attempt.error;finish('failed');throw new Error(trace.error);}
    deps.reset();trace.status='queued';persist();await sleep(n*1000);
   }
  }
  throw new Error('Crustdata request did not complete.');
 }
 return {crust:(name:string,params:Record<string,unknown>,onCache?:()=>void,context?:CrustContext)=>request(name,params,onCache,context),schemas:()=>request('get_schema',{names:[...CRUST_TOOLS],detail:'summary'},undefined,{},'get_schema')};
}
