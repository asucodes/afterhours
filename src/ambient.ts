import type {CaseRecord,Role} from '../shared/types';
import {HOMES,WORK_TARGETS} from './officeWorld';

export interface AgentBehavior {
 mode:'working'|'attention'|'idle';
 label:string;
 target:[number,number];
 animation:'work'|'read'|'coffee'|'stand';
 direction:number;
 left?:boolean;
 seatDepth?:number;
}
export const RECREATION:{label:string;target:[number,number];animation:AgentBehavior['animation'];direction:number;left?:boolean;seatDepth?:number}[]=[
 {label:'Coffee break',target:[296,352],animation:'coffee',direction:1},
 {label:'Reading in the lounge',target:[328,392],animation:'read',direction:2,seatDepth:398},
 {label:'Taking a lounge break',target:[408,392],animation:'read',direction:2,left:true,seatDepth:398},
 {label:'Browsing the bookshelves',target:[584,208],animation:'read',direction:2,left:true},
 {label:'Stretching in the common room',target:[464,384],animation:'stand',direction:0},
];
const ROLES:Role[]=['coordinator','scout','investigator','skeptic','operations'];
export function agentBehavior(record:CaseRecord|undefined,role:Role,seconds:number,reducedMotion=false):AgentBehavior {
 const working=record?.status==='running'&&record.tasks.some(t=>t.role===role&&t.status==='working');
 if(working)return {mode:'working',label:record!.tasks.find(t=>t.role===role&&t.status==='working')!.label,target:WORK_TARGETS[role],animation:'work',direction:role==='operations'?0:1};
 const needsDecision=record?.status==='needs_input'&&role==='coordinator';
 const failed=record?.status==='error'&&record.tasks.some(t=>t.role===role&&t.status==='blocked');
 if(needsDecision||failed)return {mode:'attention',label:needsDecision?'Needs your decision':'Task blocked',target:needsDecision?HOMES[role]:WORK_TARGETS[role],animation:'stand',direction:0};
 if(reducedMotion)return {mode:'idle',label:'Available',target:HOMES[role],animation:'stand',direction:0};
 const index=ROLES.indexOf(role),phase=Math.floor((Math.max(0,Number.isFinite(seconds)?seconds:0)+index*3)/24);
 const slot=(phase+index)%(RECREATION.length+1);
 if(slot===RECREATION.length)return {mode:'idle',label:'Back at their desk',target:HOMES[role],animation:'stand',direction:0};
 return {mode:'idle',...RECREATION[slot]};
}

// A seated coworker belongs in front of the sofa, while passersby keep normal floor depth.
export function actorDrawDepth(behavior:AgentBehavior,feetY:number,walking:boolean){return !walking&&behavior.seatDepth!==undefined?Math.max(feetY,behavior.seatDepth):feetY;}
