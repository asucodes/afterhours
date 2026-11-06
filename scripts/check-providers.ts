import { chat, crust, modelId } from '../server/providers';
const args=new Set(process.argv.slice(2));
console.log('Testing model:',modelId);
const answer=await chat('You are a connection test.','Reply with READY.',false);console.log('Text response:',answer.trim().slice(0,50));
if(args.has('--capabilities')) {
 const headers={Authorization:`Bearer ${process.env.TOKENHARBOR_API_KEY}`,'Content-Type':'application/json'};
 const toolResponse=await fetch('https://tokenharbor.ai/v1/chat/completions',{method:'POST',headers,body:JSON.stringify({model:modelId,messages:[{role:'user',content:'Call connection_probe with token READY.'}],tools:[{type:'function',function:{name:'connection_probe',description:'Read-only connection test.',parameters:{type:'object',properties:{token:{type:'string'}},required:['token']}}}],tool_choice:{type:'function',function:{name:'connection_probe'}},max_tokens:80}),signal:AbortSignal.timeout(60000)});
 const toolData=await toolResponse.json() as any;const call=toolData.choices?.[0]?.message?.tool_calls?.[0];console.log('Native tool call:',toolResponse.ok&&call?.function?.name==='connection_probe');
 if(call){const roundtrip=await fetch('https://tokenharbor.ai/v1/chat/completions',{method:'POST',headers,body:JSON.stringify({model:modelId,messages:[{role:'user',content:'Call connection_probe with token READY.'},toolData.choices[0].message,{role:'tool',tool_call_id:call.id,content:JSON.stringify({ok:true,token:'READY'})}],max_tokens:30}),signal:AbortSignal.timeout(60000)});const d=await roundtrip.json() as any;console.log('Tool result round trip:',!!d.choices?.[0]?.message?.content);}
 const stream=await fetch('https://tokenharbor.ai/v1/chat/completions',{method:'POST',headers,body:JSON.stringify({model:modelId,messages:[{role:'user',content:'Reply READY.'}],stream:true,max_tokens:25}),signal:AbortSignal.timeout(60000)});const streamText=await stream.text();console.log('SSE streaming:',stream.ok&&streamText.includes('data:'));
}
const credits=await crust('account_credits',{});console.log('Credit response structure:',Object.keys(credits));
if(args.has('--research')) {
 const result=await crust('company_search',{search:{query:'B2B SaaS product marketing agency developer marketing',mode:'hybrid'},limit:3,fields:['crustdata_company_id','basic_info','locations']});
 console.log('Company search structure:',Object.keys(result));console.log(JSON.stringify(result).slice(0,10000));
}
