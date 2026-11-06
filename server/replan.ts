import type { Brief, CaseRecord, InboxItem } from '../shared/types';
export function changedFields(a: Brief, b: Brief): string[] { return (['product','deadline','budget','geography','deliverables','mustHaves','preferences','exclusions'] as const).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])); }
export function applyReplan(c: CaseRecord, next: Brief) {
  const changed = changedFields(c.brief, next); if (!changed.length) return null;
  c.version += 1; c.status='draft'; c.brief=next; c.error=undefined; c.exceptions=[];
  let invalidatedTasks=0;
  for (const t of c.tasks) if(t.status!=='superseded' && t.dependsOn.some(d=>changed.includes(d))) { t.status='superseded'; invalidatedTasks++; }
  for(const a of c.artifacts) a.state='superseded';
  const fullDiscovery=changed.some(x=>['product','geography','exclusions','mustHaves','deliverables'].includes(x));
  for(const candidate of c.candidates) candidate.assessments = candidate.assessments.filter(a=>{ const r=next.requirements.find(r=>r.id===a.requirementId); return !!r && !changed.includes(r.field); });
  const r={version:c.version,changed,reusedEvidence:c.evidence.length,invalidatedTasks,reassessedCandidates:c.candidates.filter(x=>!x.rejected).length,text:fullDiscovery?'Keeping verified research. Revisiting the shortlist against your new requirements.':'Keeping company research. Rechecking affected requirements and rebuilding the package.'};
  c.replans.push(r); return r;
}
export function isCurrent(c: CaseRecord, version: number) { return c.version === version; }
export function dispatch(c: CaseRecord): InboxItem {
  if(c.status!=='complete') throw new Error('Complete the case and resolve required decisions before dispatching.');
  const artifacts=c.artifacts.filter(a=>a.version===c.version&&a.state==='current');
  if(!artifacts.length) throw new Error('There are no current deliverables to dispatch.');
  const id=`${c.id}:v${c.version}`; const existing=c.inbox.find(x=>x.id===id);if(existing)return existing;
  const item={id,caseId:c.id,version:c.version,title:`Rescue package · ${c.brief.title}`,at:new Date().toISOString(),artifactIds:artifacts.map(a=>a.id)};c.inbox.push(item);return item;
}

export function rejectCandidate(c:CaseRecord,candidateId:string,expectedVersion:number){if(c.version!==expectedVersion)throw new Error('Refresh before rejecting this candidate.');const candidate=c.candidates.find(x=>x.id===candidateId);if(!candidate)throw new Error('Candidate not found.');candidate.rejected=true;c.status='draft';c.error=undefined;c.version++;c.exceptions=[];c.artifacts.forEach(a=>a.state='superseded');c.tasks.filter(t=>t.role==='operations').forEach(t=>t.status='superseded');return candidate;}
