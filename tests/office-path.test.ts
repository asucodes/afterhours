import {test} from 'node:test';import assert from 'node:assert/strict';
import {findPath,HOMES,WORK_TARGETS,WALLS} from '../src/officeWorld';
import type {Role} from '../shared/types';
test('all coworkers can reach their task stations through the room doors',()=>{for(const role of Object.keys(HOMES) as Role[]){const [x,y]=HOMES[role],[tx,ty]=WORK_TARGETS[role];const p=findPath(x,y,tx,ty);assert.ok(p.length,`${role} has no route`);assert.deepEqual(p.at(-1),[Math.round(tx/8)*8,Math.round(ty/8)*8]);}});
test('a cross-room research handoff does not pass through walls',()=>{const [x,y]=HOMES.skeptic,[tx,ty]=WORK_TARGETS.skeptic;const p=findPath(x,y,tx,ty);for(const [px,py]of p)assert.equal(WALLS.some(w=>px>w.x&&px<w.x+w.w&&py>w.y&&py<w.y+w.h),false,`Wall crossed at ${px},${py}`);assert.ok(p.some(([,y])=>y>=240&&y<=272),'The handoff should use the main corridor.');});
