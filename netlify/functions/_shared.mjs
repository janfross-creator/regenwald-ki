/** Private helper functions. No student text is logged or stored by this application. */
import { timingSafeEqual } from 'node:crypto';

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}
  });
}
export function error(message, status = 400) { return json({error:message},status); }
export function access(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const code = process.env.KLASSEN_CODE;
  if (!apiKey || !code) return {error:error('Die KI ist noch nicht eingerichtet. Bitte die Lehrkraft informieren.',503)};
  const submitted = request.headers.get('x-class-code') || '';
  const a = Buffer.from(submitted,'utf8'), b = Buffer.from(code,'utf8');
  if (!submitted || a.length !== b.length || !timingSafeEqual(a,b)) {
    return {error:error('Der Klassencode stimmt nicht. Bitte überprüfen.',401)};
  }
  return {apiKey};
}
export function cleanTurns(value) {
  if (!Array.isArray(value)) return null;
  if (value.length === 0 || value.length > 3) return null;
  let clean=[];
  for (let i=0;i<value.length;i++) {
    const t=value[i];
    if (!t || typeof t.question !== 'string' || typeof t.answer !== 'string') return null;
    if (!t.question.trim() || !t.answer.trim() || t.answer.length>3500 || t.question.length>250) return null;
    clean.push({question:t.question.trim(),answer:t.answer.trim()});
  }
  return clean;
}
export async function readJSON(request, max=18000) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('Die Anfrage muss JSON enthalten.');
  const t=await request.text();
  if (t.length>max) throw new Error('Die Anfrage ist zu lang.');
  return JSON.parse(t);
}
export async function openAI(path, apiKey, opts, timeout=50000) {
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(),timeout);
  try {
    const response = await fetch('https://api.openai.com/v1/'+path, {
      method:'POST', headers:{Authorization:`Bearer ${apiKey}`,...opts.headers},body:opts.body,signal:ctrl.signal
    });
    const txt=await response.text();
    let payload={};
    try {payload=JSON.parse(txt)} catch {payload={};}
    if(!response.ok) {
      // The complete third-party error response is intentionally not returned to children.
      const cause=payload?.error?.message || '';
      if(response.status===429) throw new Error('Der KI-Dienst ist gerade ausgelastet oder das Nutzungslimit wurde erreicht.');
      if(response.status===401 || response.status===403) throw new Error('Die KI-Verbindung ist nicht richtig eingerichtet.');
      if(cause.includes('billing') || cause.includes('quota')) throw new Error('Das API-Guthaben ist aufgebraucht.');
      throw new Error('Der KI-Dienst hat die Anfrage nicht verarbeitet.');
    }
    return payload;
  } catch(e) {
    if(e?.name==='AbortError') throw new Error('Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.');
    throw e;
  } finally {clearTimeout(timer);}
}
export async function chatJSON(apiKey, system, user, schema, timeout=30000) {
  const result=await openAI('chat/completions', apiKey,{
    headers:{'content-type':'application/json'},
    body:JSON.stringify({
      model:process.env.TEXT_MODEL || 'gpt-5-mini',
      messages:[{role:'system',content:system},{role:'user',content:user}],
      response_format:{type:'json_schema',json_schema:{name:'result',strict:true,schema}}
    })
  }, timeout);
  const content=result?.choices?.[0]?.message?.content;
  if(!content) throw new Error('Die KI hat keine Antwort geliefert.');
  return JSON.parse(content);
}
