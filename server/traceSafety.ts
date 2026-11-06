const sensitive=/authorization|api[_-]?key|token|secret|password|cookie|credential/i;
export function scrubText(text:string,secrets:string[]=[]){let out=text;for(const secret of secrets.filter(s=>s.length>4))out=out.split(secret).join('[REDACTED]');return out.replace(/Bearer\s+[^\s"',}]+/gi,'Bearer [REDACTED]').replace(/([?&](?:api[_-]?key|token|secret|password)=)[^&#\s"']*/gi,'$1[REDACTED]');}
export function sanitizeTrace(value:unknown,secrets:string[]=[],depth=0):unknown{
 if(depth>12)return '[Depth limit]';
 if(typeof value==='string')return scrubText(value,secrets);
 if(Array.isArray(value))return value.map(v=>sanitizeTrace(v,secrets,depth+1));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,sensitive.test(key)?'[REDACTED]':sanitizeTrace(v,secrets,depth+1)]));
 return value;
}
export function responsePreview(value:unknown,secrets:string[]=[],limit=16000){const serialized=JSON.stringify(sanitizeTrace(value,secrets),null,2)??'null';return {responsePreview:serialized.slice(0,limit),responseBytes:new TextEncoder().encode(serialized).length,previewTruncated:serialized.length>limit};}
