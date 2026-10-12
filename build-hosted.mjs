import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'hosted');const app=resolve(root,'..');
const names=['index.html','style.css','script.js','assets/image3.png','assets/image4.png','assets/image5.png','assets/image9.png'];
const assets={};for(const name of names){assets['/'+name]={type:name.endsWith('.png')?'image/png':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8',content:readFileSync(resolve(app,'dist',name)).toString('base64')}}
const source=readFileSync(resolve(root,'worker/api.mjs'),'utf8').replace('export async function api','async function api')+'\nconst assets='+JSON.stringify(assets)+';\nexport default {async fetch(request,env){const url=new URL(request.url);if(url.pathname.startsWith("/api/"))return api(request,env);const item=assets[url.pathname==="/"?"/index.html":url.pathname];if(!item)return new Response("Not found",{status:404});const bytes=Uint8Array.from(atob(item.content),c=>c.charCodeAt(0));return new Response(bytes,{headers:{"Content-Type":item.type,"X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src \'self\'; img-src \'self\'; style-src \'self\' \'unsafe-inline\'; script-src \'self\'; frame-ancestors \'none\'; base-uri \'self\'; form-action \'self\'"}})}};';
mkdirSync(resolve(root,'dist/server'),{recursive:true});mkdirSync(resolve(root,'dist/.openai'),{recursive:true});writeFileSync(resolve(root,'dist/server/index.js'),source);copyFileSync(resolve(root,'.openai/hosting.json'),resolve(root,'dist/.openai/hosting.json'));console.log('Built hosted Worker with embedded assets.');

