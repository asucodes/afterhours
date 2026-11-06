import type {Evidence} from './types';
export function evidenceIssue(e:Pick<Evidence,'url'|'title'|'excerpt'|'kind'>):string|undefined{
 let u:URL;try{u=new URL(e.url);}catch{return 'Invalid source URL';}
 if(!['https:','http:'].includes(u.protocol))return 'Unsupported source URL';
 if(/(^|\.)google\.[a-z.]+$/i.test(u.hostname)&&/^\/(goto|url|search)(\/|$)/i.test(u.pathname))return 'Search redirect, not an original source';
 if(!e.excerpt.trim())return 'No retrievable source content';
 if(e.kind==='web'){
  if(/^(just a moment|attention required|access denied|sign in|log in|login|checking your browser)/i.test(e.title.trim()))return 'Challenge or login page';
  if(/cf-chl-|verify you are human|enable javascript and cookies to continue|performing security verification/i.test(e.excerpt))return 'Bot challenge, not usable evidence';
  if(e.excerpt.length<500&&/sign in to (view|continue|access)|log in to (view|continue|access)/i.test(e.excerpt))return 'Content requires login';
 }
}
export function evidenceStats(rows:Evidence[]){const usable=rows.filter(e=>!evidenceIssue(e));return {records:rows.length,usable:usable.length,excluded:rows.length-usable.length,sites:new Set(usable.map(e=>new URL(e.url).hostname.replace(/^www\./,''))).size,urls:new Set(usable.map(e=>{const u=new URL(e.url);u.hash='';return u.href;})).size};}
