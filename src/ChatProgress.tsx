import {Activity,Check,ChevronDown,LoaderCircle,AlertTriangle,Pause} from 'lucide-react';
import {TEAM,type CaseRecord,type Role,type CaseEvent} from '../shared/types';
import {caseProgress,progressText} from './progress';
function Step({event}:{event:CaseEvent}){return <li className={['tool_failed','task_blocked','handoff'].includes(event.kind)?'attention':''}><span className="work-step-dot">{['task_done','tool_completed','completed','dispatched'].includes(event.kind)&&<Check size={8}/>}</span><div><p>{progressText(event)}</p><small>{TEAM.find(t=>t.id===event.role)?.name||'Team'} · {new Date(event.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small></div></li>;}
export default function ChatProgress({record,selected,busy}:{record?:CaseRecord;selected:Role;busy:boolean}){
 if(!record)return busy?<section className="chat-work-log pending" role="status"><LoaderCircle size={14} className="spin"/><div><strong>Asu is organizing your brief</strong><p>Extracting the requirements. Unspecified details stay open.</p></div></section>:null;
 const progress=caseProgress(record,selected),running=record.status==='running';
 if(!progress.steps.length&&record.status==='draft')return null;
 const recent=progress.steps.slice(-3),earlier=progress.steps.slice(0,-3);
 return <section className="chat-work-log" aria-label="Team work log"><header><Activity size={14}/><strong>Work log</strong><span>{progress.done}/{progress.total} tasks</span></header><div className="work-current" role="status">{running?<LoaderCircle size={13} className="spin"/>:record.status==='complete'?<Check size={14}/>:record.status==='paused'?<Pause size={13}/>:<AlertTriangle size={13}/>}<p>{progress.current}</p></div>{recent.length>0&&<ol className="work-steps">{recent.map(e=><Step key={e.id} event={e}/>)}</ol>}{earlier.length>0&&<details className="work-earlier"><summary>{earlier.length} earlier steps<ChevronDown size={12}/></summary><ol className="work-steps">{earlier.map(e=><Step key={e.id} event={e}/>)}</ol></details>}</section>;
}
