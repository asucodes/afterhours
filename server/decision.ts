import type { Assessment, Brief, Candidate, Evidence } from '../shared/types';
export function normalizeAssessments(brief:Brief,raw:Assessment[],sources:Evidence[]):Assessment[]{
 const valid=new Set(sources.map(x=>x.id));
 return brief.requirements.map(req=>{
  const a=raw.find(x=>x.requirementId===req.id);const ids=(a?.evidenceIds||[]).filter(id=>valid.has(id));let status=a?.status||'unknown';let reason=a?.reason||'No usable evidence found.';
  if(status!=='unknown'&&!ids.length){status='unknown';reason='This conclusion has no valid candidate-specific citation. '+reason;}
  // This version collects public research, not a project-specific supplier quote or availability confirmation.
  if(req.field==='budget'||req.field==='deadline'){status='unknown';reason=req.field==='budget'?'A scoped supplier quote is still required. Public pricing or company size cannot confirm this project budget.':'The agency has not confirmed capacity for this launch date. Public portfolio evidence cannot establish availability.';}
  return {requirementId:req.id,status,reason,evidenceIds:ids};
 });
}
export function hasQualifiedCandidate(brief:Brief,candidates:Candidate[]){return candidates.filter(c=>!c.rejected).some(c=>brief.requirements.filter(r=>r.required).every(r=>c.assessments.find(a=>a.requirementId===r.id)?.status==='supported'));}
