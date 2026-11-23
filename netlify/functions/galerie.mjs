import { getStore } from '@netlify/blobs';
import { randomUUID, timingSafeEqual } from 'node:crypto';

const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const validSecret = (candidate,expected) => {
  if(typeof candidate!=='string'||typeof expected!=='string'||expected.length<8)return false;
  const a=Buffer.from(candidate),b=Buffer.from(expected);
  return a.length===b.length&&timingSafeEqual(a,b);
};
const safeName = str => String(str||'Bild').replace(/[<>\\\x00-\x1f]/g,'').trim().slice(0,28)||'Bild';
const storeName='waldarbeiten-v1';
export default async function handler(request){
  const url = new URL(request.url);
  const action=url.searchParams.get('action')||'submit';
  const pass=request.headers.get('x-lehrer-passwort')||'';
  const isTeacher=validSecret(pass,process.env.LEHRER_PASSWORT);
  if(!process.env.LEHRER_PASSWORT||!process.env.KLASSEN_CODE) return json({error:'Die Zugangsdaten sind noch nicht eingerichtet: KLASSEN_CODE und LEHRER_PASSWORT.'},503);
  try {
    const store=getStore(storeName);
    if(request.method==='POST'&&action==='submit'){
      if(Number(request.headers.get('content-length')||0)>2_400_000)return json({error:'Bild ist zu groß.'},413);
      const data=await request.json();
      if(!validSecret(data.code,process.env.KLASSEN_CODE))return json({error:'Der Klassencode stimmt nicht.'},403);
      if(typeof data.image!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data.image)||data.image.length>2_000_000)return json({error:'Ungültiges Bildformat oder Bild zu groß.'},400);
      if(typeof data.thumb!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(data.thumb)||data.thumb.length>100_000)return json({error:'Vorschaubild ungültig.'},400);
      const raw=Buffer.from(data.image.split(',')[1],'base64');
      if(raw.length<100||raw.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')return json({error:'Bilddatei ist kein PNG.'},400);
      const id=randomUUID(),name=safeName(data.name);
      const item={id,name,createdAt:new Date().toISOString(),image:data.image,thumb:data.thumb};
      await store.set(id,JSON.stringify(item),{metadata:{name,createdAt:item.createdAt}});
      return json({ok:true,id});
    }
    if(!isTeacher)return json({error:'Lehrerpasswort falsch.'},403);
    if(request.method==='GET'&&action==='list'){
      const {blobs}=await store.list({paginate:false});
      const chosen=blobs.slice(-120);
      const items=(await Promise.all(chosen.map(async b=>{
        const item=await store.get(b.key,{type:'json'});
        return item?{id:item.id,name:item.name,createdAt:item.createdAt,thumb:item.thumb}:null;
      }))).filter(Boolean).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      return json({items});
    }
    if(request.method==='GET'&&action==='image'){
      const id=url.searchParams.get('id');if(!/^[0-9a-f-]{36}$/.test(id||''))return json({error:'Ungültige Bildnummer.'},400);
      const item=await store.get(id,{type:'json'});
      if(!item)return json({error:'Bild nicht gefunden.'},404);
      return json({id:item.id,name:item.name,createdAt:item.createdAt,image:item.image});
    }
    if(request.method==='POST'&&action==='delete'){
      const {id}=await request.json();if(!/^[0-9a-f-]{36}$/.test(id||''))return json({error:'Ungültige Bildnummer.'},400);
      await store.delete(id);return json({ok:true});
    }
    return json({error:'Unbekannte Aktion.'},405);
  }catch(err){console.error('Galeriefehler',err);return json({error:'Speichern oder Laden derzeit nicht möglich.'},500)}
}
