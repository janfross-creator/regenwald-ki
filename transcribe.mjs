import {json,error,access,openAI} from './_shared.mjs';
export default async(request)=>{
  if(request.method!=='POST')return error('Nur POST ist erlaubt.',405);
  const auth=access(request);if(auth.error)return auth.error;
  try {
    const form=await request.formData();
    const file=form.get('audio');
    if(!file || typeof file.arrayBuffer!=='function')return error('Es wurde keine Aufnahme übermittelt.');
    if(file.size>4_000_000)return error('Die Aufnahme ist zu groß. Bitte kürzer sprechen.');
    if(file.size<100)return error('Die Aufnahme ist zu kurz.');
    const forwarded=new FormData();
    const type=file.type||'audio/mp4';
    const suffix=type.includes('webm')?'webm':type.includes('ogg')?'ogg':'m4a';
    forwarded.append('file',new Blob([await file.arrayBuffer()],{type}),`regenwald.${suffix}`);
    forwarded.append('model',process.env.TRANSCRIBE_MODEL||'gpt-transcribe');
    forwarded.append('prompt','Deutsche Schülerin oder deutscher Schüler beschreibt eine ausgedachte Waldlandschaft. Transkribiere wortgetreu, auch ungewöhnliche Tiere, Farben, Lianen, Äste, Blatt- und Bodenbeschreibungen.');
    const result=await openAI('audio/transcriptions',auth.apiKey,{body:forwarded},45000);
    const text=String(result?.text||'').trim();
    if(!text)return error('Ich habe nichts verstanden. Bitte versuche es erneut.',422);
    return json({text:text.slice(0,3500)});
  } catch(e) {return error(e.message||'Die Spracherkennung hat nicht funktioniert.',500)}
};
