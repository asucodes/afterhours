import type {Brief,CaseRecord,Role} from '../shared/types';
import {applyReplan} from '../server/replan';
export const SCENARIOS={
 certificates:{label:'The key is 4',customer:'Firefox, probably',tag:'News-inspired parody',headline:['The private key is 4.','We need backup.'],message:'One of the certificate authorities we trusted picked 4 as a private key. Four. Please find us a response team with a more ambitious relationship with numbers.',reply:'On it. I’ll find specialist teams, check their experience, and keep every gap explicit.',prompt:'Fictional hackathon scenario inspired by the eMudhra weak-key incident: we operate a browser and need to find external incident-response and PKI consulting teams in India. We need public evidence of certificate incident response, PKI expertise, and incident communications support. Prepare a sourced comparison, quote-request drafts, and a handover checklist. Do not claim to remediate systems, rotate keys, contact providers, or confirm availability. Budget and deadline are not set yet.'},
 launch:{label:'The agency ghosted',customer:'A founder, unfortunately',tag:'Launch rescue scenario',headline:['Our agency ghosted.','Friday didn’t.'],message:'The launch is Friday. Our agency has discovered the powerful life skill of not replying. We need a replacement, a landing page, and possibly a cup of tea.',reply:'Let’s separate the deadline, the deliverables, and the must-haves. Then I’ll put the team on it.',prompt:'Our agency just pulled out. We are launching a developer-focused API monitoring tool next Friday. We need launch messaging, a landing page, and developer marketing content. Budget ₹3 lakh. Find replacement agencies in India with relevant B2B SaaS work. Prepare quote requests and a handover plan.'},
};
export type Scenario=keyof typeof SCENARIOS;
export const RESEARCH_SOURCES=[
 {label:'Company search & discovery',url:'https://crustdata.com/apis/company-discovery'},
 {label:'Company enrichment',url:'https://crustdata.com/apis/company-enrichment'},
 {label:'People search & enrichment',url:'https://crustdata.com/people-api'},
 {label:'MCP tools & web research',url:'https://crustdata.com/mcp-server'},
 {label:'Watcher & change events',url:'https://crustdata.com/apis/watcher'},
];
export function replanIllustration(field:'deadline'|'budget'|'geography'){
 const brief:Brief={title:'Illustrative rescue',product:'Developer tool launch',deadline:'Friday',budget:'₹3 lakh',geography:'India',deliverables:['Launch support'],mustHaves:[],preferences:[],exclusions:[],requirements:[]};
 const specs:{role:Role;label:string;dependsOn:string[]}[]=[
  {role:'scout',label:'Find providers',dependsOn:['product','geography','mustHaves','deliverables','exclusions']},
  ...['A','B','C'].map(n=>({role:'investigator' as Role,label:`Investigate ${n}`,dependsOn:['product','mustHaves','deliverables','geography']})),
  ...['A','B','C'].map(n=>({role:'skeptic' as Role,label:`Check ${n}`,dependsOn:['product','deadline','budget','geography','deliverables','mustHaves','preferences','exclusions']})),
  {role:'operations',label:'Prepare handover',dependsOn:['product','deadline','budget','geography','deliverables','mustHaves','preferences','exclusions']},
 ];
 const c={id:'illustration',version:1,brief,tasks:specs.map((t,i)=>({...t,id:String(i),status:'done' as const,version:1})),evidence:[],candidates:[],artifacts:[],replans:[],exceptions:[]} as unknown as CaseRecord;
 const result=applyReplan(c,{...brief,[field]:field==='deadline'?'Wednesday':field==='budget'?'₹2 lakh':'Singapore'})!;
 return {tasks:c.tasks,kept:c.tasks.filter(t=>t.status==='done').length,reopened:result.invalidatedTasks,total:c.tasks.length};
}
