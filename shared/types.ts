export type Role = 'coordinator' | 'scout' | 'investigator' | 'skeptic' | 'operations';
export type Status = 'draft' | 'running' | 'paused' | 'needs_input' | 'complete' | 'error';
export type AssessmentStatus = 'supported' | 'contradicted' | 'unknown';
export interface Requirement { id: string; label: string; field: string; required: boolean; }
export interface Brief { title: string; product: string; deadline: string; budget: string; geography: string; deliverables: string[]; mustHaves: string[]; preferences: string[]; exclusions: string[]; requirements: Requirement[]; }
export interface Evidence { id: string; candidateId?: string; url: string; title: string; excerpt: string; tool: string; retrievedAt: string; kind: 'company' | 'web' | 'person'; }
export interface Assessment { requirementId: string; status: AssessmentStatus; reason: string; evidenceIds: string[]; }
export interface Candidate { id: string; name: string; domain: string; description: string; companyId?: number; location?: string; headcount?: string; contact?: string; rejected: boolean; assessments: Assessment[]; summary: string; }
export interface Task { id: string; role: Role; label: string; status: 'queued' | 'working' | 'done' | 'blocked' | 'superseded'; version: number; dependsOn: string[]; candidateId?: string; }
export interface CaseEvent { id: number; at: string; kind: string; role?: Role; text: string; version: number; data?: Record<string, unknown>; }
export interface Message { id: string; role: Role | 'user'; to?: Role; text: string; at: string; }
export interface Artifact { id: string; title: string; kind: 'comparison' | 'quote' | 'handover'; body: string; version: number; state: 'current' | 'superseded'; candidateId?: string; }
export interface InboxItem { id: string; caseId: string; version: number; title: string; at: string; artifactIds: string[]; }
export interface Replan { version: number; changed: string[]; reusedEvidence: number; invalidatedTasks: number; reassessedCandidates: number; text: string; }
export interface CaseRecord { id: string; createdAt: string; updatedAt: string; status: Status; version: number; prompt: string; brief: Brief; candidates: Candidate[]; evidence: Evidence[]; tasks: Task[]; events: CaseEvent[]; messages: Message[]; artifacts: Artifact[]; inbox: InboxItem[]; replans: Replan[]; exceptions: string[]; error?: string; metrics: { modelCalls: number; toolCalls: number; cacheHits: number; }; }
export const TEAM: { id: Role; name: string; title: string; color: string; initials: string; line: string }[] = [
  { id: 'coordinator', name: 'Asu', title: 'Team lead', color: '#e8be7f', initials: 'AS', line: 'A little chaos. A clear way forward.' },
  { id: 'scout', name: 'Sheer', title: 'Provider scout', color: '#98bda8', initials: 'SH', line: 'There’s a good team out there. I’ll find them.' },
  { id: 'investigator', name: 'Tan', title: 'Investigator', color: '#a6b6d9', initials: 'TA', line: 'A nice website isn’t the whole story.' },
  { id: 'skeptic', name: 'Yes', title: 'Evidence critic', color: '#d69b8e', initials: 'YE', line: 'Looks promising. Let’s check that.' },
  { id: 'operations', name: 'Isit', title: 'Operations', color: '#bcaad2', initials: 'IS', line: 'I’ll turn the research into your next move.' },
];
