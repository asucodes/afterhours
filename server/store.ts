import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import type { CaseRecord } from '../shared/types';
import {recoverCase} from './recovery';
mkdirSync('data', { recursive: true });
const db = new DatabaseSync(process.env.AFTERHOURS_DB || 'data/afterhours.sqlite');
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, updated TEXT NOT NULL, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, body TEXT NOT NULL, created TEXT NOT NULL);');
export function saveCase(c: CaseRecord) { c.updatedAt = new Date().toISOString(); db.prepare('INSERT INTO cases VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated,body=excluded.body').run(c.id, c.updatedAt, JSON.stringify(c)); }
export function getCase(id: string): CaseRecord | undefined { const r = db.prepare('SELECT body FROM cases WHERE id=?').get(id) as { body: string } | undefined; return r ? JSON.parse(r.body) : undefined; }
export function listCases() { return (db.prepare('SELECT body FROM cases ORDER BY updated DESC LIMIT 20').all() as { body: string }[]).map(r => { const c = JSON.parse(r.body) as CaseRecord; return { id:c.id, title:c.brief.title, status:c.status, updatedAt:c.updatedAt }; }); }
export function cacheGet(key: string) { const r = db.prepare('SELECT body,created FROM cache WHERE key=?').get(key) as { body: string;created:string } | undefined; return r&&Date.now()-Date.parse(r.created)<24*60*60*1000 ? JSON.parse(r.body) : undefined; }
export function cacheSet(key: string, value: unknown) { db.prepare('INSERT OR REPLACE INTO cache VALUES (?, ?, ?)').run(key, JSON.stringify(value), new Date().toISOString()); }
export function recoverInterrupted(){for(const row of db.prepare('SELECT body FROM cases').all() as {body:string}[]){const c=JSON.parse(row.body) as CaseRecord;if(recoverCase(c))saveCase(c);}}

// Request traces are separate from case evidence and never contain authentication headers.
db.exec('CREATE TABLE IF NOT EXISTS crust_requests (id TEXT PRIMARY KEY, case_id TEXT, started TEXT NOT NULL, body TEXT NOT NULL); CREATE INDEX IF NOT EXISTS crust_requests_case ON crust_requests(case_id,started);');
export function saveCrustTrace(row:import('../shared/crustTrace').CrustTrace){db.prepare('INSERT INTO crust_requests VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(row.id,row.caseId||null,row.startedAt,JSON.stringify(row));}
export function listCrustTraces(caseId?:string,limit=200,before?:string):import('../shared/crustTrace').CrustTraceSnapshot {
 const sql=caseId?'SELECT body FROM crust_requests WHERE case_id=? ORDER BY started DESC,id DESC':'SELECT body FROM crust_requests ORDER BY started DESC,id DESC';
 const raw=(caseId?db.prepare(sql).all(caseId):db.prepare(sql).all()) as {body:string}[];
 const rows=raw.map(r=>JSON.parse(r.body) as import('../shared/crustTrace').CrustTrace);
 const eligible=before?rows.filter(r=>`${r.startedAt}|${r.id}`<before):rows;const page=eligible.slice(0,limit);const first=db.prepare('SELECT MIN(started) AS first FROM crust_requests').get() as {first:string|null};
 return {requests:page,total:rows.length,hasMore:eligible.length>limit,nextCursor:page.length?`${page.at(-1)!.startedAt}|${page.at(-1)!.id}`:undefined,captureStartedAt:first.first||undefined,counts:{networkAttempts:rows.reduce((n,r)=>n+r.attempts.filter(a=>a.sent).length,0),cacheHits:rows.filter(r=>r.status==='cached').length,failed:rows.filter(r=>r.status==='failed').length,active:rows.filter(r=>r.status==='running'||r.status==='queued').length}};
}
export function recoverCrustTraces(){for(const row of db.prepare('SELECT body FROM crust_requests').all() as {body:string}[]){const r=JSON.parse(row.body) as import('../shared/crustTrace').CrustTrace;if(r.status==='queued'||r.status==='running'){r.status='interrupted';r.finishedAt=new Date().toISOString();r.error='The backend restarted before this request completed.';for(const a of r.attempts)if(a.status==='running'){a.status='interrupted';a.finishedAt=r.finishedAt;}saveCrustTrace(r);}}}
