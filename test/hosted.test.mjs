import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {api} from '../hosted/worker/api.mjs';
test('Hosted API: registration, sessions and isolated persistent requests',async()=>{
const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('hosted/drizzle/0000_init.sql','utf8'));
const DB={prepare(sql){let params=[];return {bind(...values){params=values;return this},async first(){return sqlite.prepare(sql).get(...params)||null},async all(){return {results:sqlite.prepare(sql).all(...params)}},async run(){return sqlite.prepare(sql).run(...params)}}},async batch(statements){return Promise.all(statements.map(s=>s.run()))}};
const call=async(path,data,cookie)=>{const response=await api(new Request('https://vanta.example/api/'+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined}),{DB});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]}};
const a=await call('register',{name:'A',email:'a@example.com',password:'Password123'});assert.equal(a.status,201);assert.equal((await call('login',{email:'a@example.com',password:'Incorrect'})).status,401);
assert.equal((await call('requests',{name:'A',phone:'+7 999 123 45 67',email:'a@example.com',budget:'200000',model:'Porsche'},a.cookie)).status,201);
assert.equal((await call('requests',undefined,a.cookie)).data.requests.length,1);
const b=await call('register',{name:'B',email:'b@example.com',password:'Password123'});assert.equal((await call('requests',undefined,b.cookie)).data.requests.length,0);
await call('logout',{},a.cookie);assert.equal((await call('requests',undefined,a.cookie)).status,401);sqlite.close();
});
