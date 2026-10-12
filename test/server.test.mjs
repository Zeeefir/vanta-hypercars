import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('Registration, login, SQLite requests and account isolation',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'vanta-test-'));const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'3011',DB_PATH:join(dir,'test.sqlite')},stdio:['ignore','pipe','pipe']});
 try{await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(Error('Server exited '+code)))});
 const call=async(path,data,cookie)=>{const r=await fetch('http://localhost:3011/api/'+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
 assert.equal((await call('requests')).status,401);
 const first=await call('register',{name:'Test A',email:'a@example.com',password:'secure-pass-123'});assert.equal(first.status,201);assert.ok(first.cookie);
 assert.equal((await call('register',{name:'Duplicate',email:'a@example.com',password:'secure-pass-123'})).status,409);
 assert.equal((await call('login',{email:'a@example.com',password:'incorrect'})).status,401);
 const request=await call('requests',{name:'Test A',phone:'+7 999 123 45 67',email:'a@example.com',budget:'$200 000 — $400 000',model:'Porsche 911',comment:'Test'},first.cookie);assert.equal(request.status,201);
 assert.equal((await call('requests',undefined,first.cookie)).data.requests.length,1);
 const second=await call('register',{name:'Test B',email:'b@example.com',password:'another-pass-123'});assert.equal((await call('requests',undefined,second.cookie)).data.requests.length,0);
 assert.equal((await call('requests',{name:'A',phone:'bad',email:'a@example.com',budget:'test',model:'test'},first.cookie)).status,400);
 await call('logout',{},first.cookie);assert.equal((await call('requests',undefined,first.cookie)).status,401);
 const login=await call('login',{email:'a@example.com',password:'secure-pass-123'});assert.equal(login.status,200);assert.equal((await call('requests',undefined,login.cookie)).data.requests.length,1);
 const cross=await fetch('http://localhost:3011/api/logout',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:'{}'});assert.equal(cross.status,403);
 }finally{child.kill();await new Promise(r=>child.once('exit',r));rmSync(dir,{recursive:true,force:true})}
});
