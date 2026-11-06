import {test} from 'node:test';import assert from 'node:assert/strict';
import {evidenceIssue,evidenceStats} from '../shared/evidenceQuality';
import type {Evidence} from '../shared/types';
const base:Evidence={id:'e',candidateId:'c',url:'https://provider.example/work',title:'Portfolio',excerpt:'A detailed case study',tool:'web_enrich_live',kind:'web',retrievedAt:''};
test('redirects, challenge pages, login walls, and empty content are not citable',()=>{for(const patch of [{url:'https://www.google.com/goto?x=123'},{title:'Just a moment...'},{excerpt:'Enable JavaScript and cookies to continue'},{title:'Sign in to view'},{excerpt:''}])assert.ok(evidenceIssue({...base,...patch}));});
test('normal pages containing a sign-in footer remain usable',()=>{assert.equal(evidenceIssue({...base,excerpt:'A detailed public case study. '.repeat(30)+'Sign in to view your account.'}),undefined);});
test('source statistics distinguish records, unique URLs, usable sites and excluded records',()=>{const stats=evidenceStats([base,{...base,id:'two'},{...base,id:'bad',url:'https://google.com/url?url=x'}]);assert.deepEqual(stats,{records:3,usable:2,excluded:1,sites:1,urls:1});});
