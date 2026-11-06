import {z} from 'zod';
import type {Brief} from '../shared/types';
export const briefInputSchema=z.object({title:z.string().max(100),product:z.string().max(2000),deadline:z.string().max(500),budget:z.string().max(500),geography:z.string().max(500),deliverables:z.array(z.string().max(500)).max(15),mustHaves:z.array(z.string().max(500)).max(15),preferences:z.array(z.string().max(500)).max(15),exclusions:z.array(z.string().max(500)).max(15)});
export function parseModelBrief(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))return briefInputSchema.parse(value);
 const draft={...value} as Record<string,unknown>;
 for(const field of ['title','product','deadline','budget','geography'])if(draft[field]==null)draft[field]='';
 for(const field of ['deliverables','mustHaves','preferences','exclusions'])if(draft[field]==null)draft[field]=[];
 // The title is an automatically generated display label; retain all business facts in the other fields.
 if(typeof draft.title==='string')draft.title=draft.title.trim().slice(0,100)||'Business emergency';
 return briefInputSchema.parse(draft);
}
export function withRequirements(b:z.infer<typeof briefInputSchema>):Brief {
 const requirements=[{id:'product',label:`Relevant experience: ${b.product}`,field:'product',required:true},...b.mustHaves.map((s,i)=>({id:`must-${i}`,label:s,field:'mustHaves',required:true})),...b.deliverables.map((s,i)=>({id:`deliverable-${i}`,label:s,field:'deliverables',required:true}))];
 if(b.deadline)requirements.push({id:'deadline',label:`Confirmed availability: ${b.deadline}`,field:'deadline',required:true});
 if(b.budget)requirements.push({id:'budget',label:`Confirmed quote within ${b.budget}`,field:'budget',required:true});
 if(b.geography&&!/anywhere|global|remote|unspecified/i.test(b.geography))requirements.push({id:'geography',label:`Provider location: ${b.geography}`,field:'geography',required:true});
 requirements.push(...b.exclusions.map((s,i)=>({id:`exclusion-${i}`,label:`Must avoid: ${s}`,field:'exclusions',required:true})));
 return {...b,requirements};
}
