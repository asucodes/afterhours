import {test} from 'node:test';import assert from 'node:assert/strict';
import {agentBehavior,RECREATION,actorDrawDepth} from '../src/ambient';
import {findPath,HOMES,WORK_TARGETS,FURNITURE} from '../src/officeWorld';
import type {CaseRecord,Role} from '../shared/types';
test('all leisure stations are reachable from every coworker room',()=>{for(const role of Object.keys(HOMES) as Role[])for(const stop of RECREATION){const [x,y]=HOMES[role];assert.ok(findPath(x,y,...stop.target).length,`${role} cannot reach ${stop.label}`);}});
test('real work interrupts the ambient routine immediately',()=>{const record={status:'running',tasks:[{role:'scout',status:'working',label:'Find agencies'}]} as CaseRecord;const b=agentBehavior(record,'scout',80);assert.equal(b.mode,'working');assert.deepEqual(b.target,WORK_TARGETS.scout);assert.equal(b.animation,'work');});
test('blocked and decision states do not look like recreation',()=>{const record={status:'needs_input',tasks:[]} as unknown as CaseRecord;assert.equal(agentBehavior(record,'coordinator',0).mode,'attention');record.status='error';record.tasks=[{role:'skeptic',status:'blocked'}] as CaseRecord['tasks'];assert.equal(agentBehavior(record,'skeptic',0).mode,'attention');});
test('reduced motion leaves available coworkers at their own desks',()=>{const a=agentBehavior(undefined,'operations',0,true),b=agentBehavior(undefined,'operations',120,true);assert.deepEqual(a.target,HOMES.operations);assert.deepEqual(a,b);});
test('idle routines rotate without changing case state',()=>{const record={status:'complete',tasks:[]} as unknown as CaseRecord;const before=JSON.stringify(record);assert.notDeepEqual(agentBehavior(record,'coordinator',0).target,agentBehavior(record,'coordinator',24).target);assert.equal(JSON.stringify(record),before);});

test('initial frame clock skew always produces a valid destination',()=>{for(const seconds of [-.001,NaN,Infinity])for(const role of Object.keys(HOMES) as Role[])assert.equal(agentBehavior(undefined,role,seconds).target.length,2);});

test('seated readers draw above their sofas; walking coworkers retain floor depth',()=>{
 for(const stop of RECREATION.filter(s=>s.seatDepth!==undefined)){
  const sofa=FURNITURE.find(f=>f.key==='SOFA_SIDE'&&f.x===stop.target[0]-8)!;
  assert.ok(sofa);
  const behavior={mode:'idle' as const,...stop};
  assert.ok(actorDrawDepth(behavior,stop.target[1],false)>sofa.y+32);
  assert.equal(actorDrawDepth(behavior,360,true),360);
 }
});
