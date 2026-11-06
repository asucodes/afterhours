import {TEAM,type CaseRecord,type CaseEvent,type Role} from '../shared/types';
const tools:Record<string,string>={company_search:'Searching for providers',company_identify:'Resolving company identity',company_enrich:'Checking company records',person_search:'Looking up professional context',web_search_live:'Searching public sources',web_enrich_live:'Reading a source page'};
export function progressText(event:CaseEvent){
 const name=String(event.data?.tool||'');
 if(event.kind==='tool_started')return tools[name]||'Requesting research';
 if(event.kind==='tool_completed')return `${tools[name]||'Research request'} · ${event.data?.cached?'reused saved response':'response received'}`;
 if(event.kind==='tool_failed')return `${tools[name]||'Research request'} · request failed`;
 if(event.kind==='evidence_added')return `Source saved · ${event.text}`;
 return event.text;
}
export function caseProgress(record:CaseRecord,selected:Role){
 const tasks=record.tasks.filter(t=>t.status!=='superseded'&&(selected==='coordinator'||t.role===selected));
 const events=record.events.filter(e=>e.version===record.version&&(selected==='coordinator'||e.role===selected||(!e.role&&['replanned','completed','handoff','started','resumed'].includes(e.kind))));
 const working=tasks.filter(t=>t.status==='working');
 const runBoundary=record.events.filter(e=>e.version===record.version&&['started','resumed'].includes(e.kind)).at(-1)?.id||0;
 const outstanding=events.filter(e=>e.id>runBoundary&&e.kind==='tool_started'&&e.data?.requestId&&!events.some(end=>['tool_completed','tool_failed'].includes(end.kind)&&end.data?.requestId===e.data?.requestId));
 const activeTool=record.status==='running'?outstanding.at(-1):undefined;
 const groupedWorking=[...new Set(working.map(t=>t.role))].map(role=>{const own=working.filter(t=>t.role===role),name=TEAM.find(m=>m.id===role)?.name;return own.length>1?`${name} is ${role==='skeptic'?'checking':role==='investigator'?'investigating':'working on'} ${own.length} candidates`:`${name}: ${own[0].label}`;}).join(' · ');
 const current=activeTool?`${TEAM.find(t=>t.id===activeTool.role)?.name||'Team'} · ${progressText(activeTool)}`:working.length&&record.status==='running'?groupedWorking:record.status==='draft'?'Asu has prepared a draft. Review it before starting research.':record.status==='paused'?'Team paused. Saved work is retained.':record.status==='needs_input'?'Research needs your decision. Review the unresolved checks.':record.status==='error'?'A step needs attention. You can retry from saved progress.':record.status==='complete'?'The handover package is ready to review.':'The team is preparing the next step.';
 const kinds=new Set(['task_started','task_done','task_blocked','tool_completed','tool_failed','evidence_added','replanned','handoff','completed','dispatched']);
 return {current,working,steps:events.filter(e=>kinds.has(e.kind)),done:tasks.filter(t=>t.status==='done').length,total:tasks.length};
}
