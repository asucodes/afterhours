import { config } from 'dotenv';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { cacheGet, cacheSet,saveCrustTrace } from './store';
import {EventEmitter} from 'node:events';
import {createCrustService} from './crustService';
export const crustTraceBus=new EventEmitter();crustTraceBus.setMaxListeners(100);
import {ModelOutputError,validationDetails} from './errors';
config({path:'.env.local', quiet:true});
const BASE='https://tokenharbor.ai/v1';
export const modelId=process.env.TOKENHARBOR_MODEL || 'deepseek-v4.1-flash:free';
let clientPromise: Promise<Client> | undefined;
async function connection() {
  if(!process.env.CRUSTDATA_API_KEY) throw new Error('Add CRUSTDATA_API_KEY to .env.local and restart the backend.');
  if(!clientPromise) clientPromise=(async()=>{const c=new Client({name:'afterhours',version:'0.1.0'});await c.connect(new StreamableHTTPClientTransport(new URL('https://install.crustdata.com/mcp'),{requestInit:{headers:{Authorization:`Bearer ${process.env.CRUSTDATA_API_KEY}`}}}));return c;})().catch(e=>{clientPromise=undefined;throw e;});
  return clientPromise;
}
let lastCrust=0;let queue=Promise.resolve();
async function rateLimit(){const next=queue.then(async()=>{const ms=Math.max(0,6200-(Date.now()-lastCrust));if(ms)await new Promise(r=>setTimeout(r,ms));lastCrust=Date.now();});queue=next.catch(()=>{});await next;}
const service=createCrustService({connect:connection,reset:()=>{const prior=clientPromise;clientPromise=undefined;void prior?.then(c=>c.close()).catch(()=>{});},wait:rateLimit,cacheGet,cacheSet,secrets:()=>[process.env.CRUSTDATA_API_KEY||'',process.env.TOKENHARBOR_API_KEY||''],record:row=>{saveCrustTrace(row);crustTraceBus.emit('update',row);}});
export const crust=service.crust;
export const crustSchemas=service.schemas;
export function parseJSON(text:string) { let s=text.replace(/<think>[\s\S]*?<\/think>/g,'').trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''); try{return JSON.parse(s);}catch{const start=s.search(/[\[{]/);const end=Math.max(s.lastIndexOf('}'),s.lastIndexOf(']'));if(start>=0&&end>start)return JSON.parse(s.slice(start,end+1));throw new Error('The model returned an incomplete structured response. Please retry.');} }
export async function chat(system:string,user:string,json=true):Promise<string> {
  if(!process.env.TOKENHARBOR_API_KEY)throw new Error('Add TOKENHARBOR_API_KEY to .env.local and restart the backend.');
  const body={model:modelId,messages:[{role:'system',content:system+(json?' Return only valid JSON, no markdown fences.':'')},{role:'user',content:user}],max_tokens:8000,reasoning_effort:'low',temperature:0.25};
  for(let attempt=0;attempt<3;attempt++) {
    const r=await fetch(`${BASE}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${process.env.TOKENHARBOR_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});
    if((r.status===429||r.status>=500)&&attempt<2){const retry=Number(r.headers.get('retry-after')||3);await new Promise(ok=>setTimeout(ok,Math.min(Math.max(retry,2),15)*1000));continue;}
    if(!r.ok)throw new Error(`TokenHarbor request failed (${r.status}). ${r.status===402?'Check your balance.':r.status===401?'Check the local API key.':'Try again or check model availability.'}`);
    const d=await r.json() as any;const text=d.choices?.[0]?.message?.content;if(!text){if(attempt<2){body.max_tokens=Math.min(body.max_tokens*2,16000);continue;}throw new Error('The model returned no final answer after bounded retries. Your research is saved; retry this task.');}return text;
  }throw new Error('Model temporarily unavailable. Your progress is saved.');
}
export async function jsonModel<T>(system:string,user:string,validate:(x:unknown)=>T):Promise<T> {
 const first=await chat(system,user);
 try{return validate(parseJSON(first));}catch(error){
  const details=validationDetails(error);const retry=await chat(system,`${user}\nThe previous answer failed validation. ${details.length?JSON.stringify(details):'Return a complete, valid JSON object.'}\nPrevious answer:\n${first.slice(0,20000)}\nCorrect these issues and return the complete JSON object.`);
  try{return validate(parseJSON(retry));}catch{throw new ModelOutputError();}
 }
}
export async function health() {const credits=await crust('account_credits',{});return {model:modelId,crustdata:true,credits};}
