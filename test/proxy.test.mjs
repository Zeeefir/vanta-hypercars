import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/proxy.js';

test('Vercel API proxy preserves sessions and rejects cross-site and unknown requests', async () => {
  const realFetch = globalThis.fetch;
  function response(){return {code:200,headers:{},setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(data){this.data=data;return this},send(data){this.data=data;return this}}}
  try {
    globalThis.fetch = async (url,options) => {
      assert.equal(url,'https://vanta-stas-college-two.foggyfig16.chatgpt.site/api/login');
      assert.equal(options.headers.Origin,'https://vanta-stas-college-two.foggyfig16.chatgpt.site');
      assert.equal(options.headers.Cookie,'session=test');
      return new Response(JSON.stringify({user:{id:1}}),{status:200,headers:{'Content-Type':'application/json','Set-Cookie':'session=new; HttpOnly; Secure; SameSite=Lax; Path=/'}});
    };
    const base={method:'POST',query:{route:'login'},headers:{host:'vanta.vercel.app',origin:'https://vanta.vercel.app','content-type':'application/json',cookie:'session=test'},body:{email:'test@example.com',password:'example-pass'}};
    const res=response();await handler(base,res);assert.equal(res.code,200);assert.match(res.headers['Set-Cookie'][0],/HttpOnly/);
    const cross=response();await handler({...base,headers:{...base.headers,origin:'https://evil.example'}},cross);assert.equal(cross.code,403);
    const unknown=response();await handler({...base,query:{route:'https://evil.example'}},unknown);assert.equal(unknown.code,404);
  } finally {globalThis.fetch=realFetch}
});

