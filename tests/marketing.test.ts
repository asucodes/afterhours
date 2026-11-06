import {test} from 'node:test';
import assert from 'node:assert/strict';
import {replanIllustration,SCENARIOS} from '../src/marketingData';
import {AGENT_PROFILES} from '../shared/agentProfiles';
import {TEAM} from '../shared/types';
test('the methodology explorer uses actual replan behavior for narrow and broad changes',()=>{
 const narrow=replanIllustration('deadline');assert.equal(narrow.kept,4);assert.equal(narrow.reopened,4);
 assert.equal(narrow.tasks.filter(t=>t.role==='investigator').every(t=>t.status==='done'),true);
 const broad=replanIllustration('geography');assert.equal(broad.kept,0);assert.equal(broad.reopened,8);
 assert.equal(replanIllustration('deadline').kept,4,'exploring a different scenario must not mutate later examples');
});
test('every coworker has an individual conversational voice',()=>{assert.equal(new Set(TEAM.map(t=>AGENT_PROFILES[t.id].voice)).size,5);for(const member of TEAM)assert.match(AGENT_PROFILES[member.id].voice,new RegExp(member.name));});
test('news-inspired mission is explicitly fictional and bounded to sourcing',()=>{assert.match(SCENARIOS.certificates.prompt,/Fictional/);assert.match(SCENARIOS.certificates.prompt,/Do not claim to remediate/);});
