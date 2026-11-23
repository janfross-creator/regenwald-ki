import {json,error,access,cleanTurns,readJSON,chatJSON} from './_shared.mjs';
const FIRST_QUESTION='Beschreibe möglichst genau, wie dein Wald in deiner Vorstellung aussieht.';
const schema={type:'object',additionalProperties:false,properties:{question:{type:'string'}},required:['question']};
const rules=`Du bist ein ruhiger, aufmerksamer Gesprächspartner für 12- bis 13-jährige Kinder. Sie beschreiben, wie sie sich nach einer Traumreise einen Wald vorstellen. Deine einzige Aufgabe ist, ENTWEDER EINE kurze sinnvolle Nachfrage zurückzugeben ODER mit einem leeren String das Gespräch zu beenden. Du bewertest oder korrigierst nie die Vorstellung. Fantastische, fachlich unpassende Dinge sind erlaubt.
Erste Frage ist bereits gestellt; höchstens ZWEI weitere Fragen sind zulässig, insgesamt also maximal DREI.
Beachte alle schon genannten Merkmale, auch beiläufige und umgangssprachliche Aussagen: Baumhöhe, Menge, Dichte, Blätter, Formen/Farben, Lianen oder hängende Äste, Licht oben/unten, feuchter/trockener/nasser Boden, Tiere, Blickrichtung, Positionen und Verneinungen. Du musst keine Fachwörter voraussetzen. Erkläre nichts. Ergänze nichts.
Wenn der Wald bereits gut vorstellbar ist, frage NICHT weiter: gib {"question":""} aus. Kein starrer Pflicht-Fragenkatalog. Bei einer großen Lücke stelle nur EINE offene, kurze, hilfreiche Nachfrage von höchstens 14 Wörtern. Priorisiere bildwirksame Lücken (z.B. Boden, oben/Licht, Baumstruktur), nicht automatisch Tiere. Frage niemals nach etwas, das schon beschrieben oder ausdrücklich verneint wurde. Frage bei Frage 3 nur, wenn es wirklich hilft. Kein Lob, keine Einleitung. Keine mehrere Fragesätze. Die Ausgabe enthält ausschließlich JSON.`;
export default async (request)=>{
  if(request.method!=='POST') return error('Nur POST ist erlaubt.',405);
  const auth=access(request); if(auth.error)return auth.error;
  try {
    const body=await readJSON(request);
    const turns=cleanTurns(body.turns);
    if(!turns) return error('Die Antworten sind unvollständig.');
    if(turns[0].question!==FIRST_QUESTION) return error('Bitte starte die Traumreise neu.');
    if(turns.length>=3 || body.finishNow===true) return json({mode:'finish'});
    const result=await chatJSON(auth.apiKey,rules,JSON.stringify({fragen_bisher:turns,weitere_fragen_hoechstens:3-turns.length}),schema);
    const question=String(result.question||'').trim().replace(/^["'“„]+|["'“”]+$/g,'').slice(0,180);
    if(!question || !question.includes('?'))return json({mode:'finish'});
    return json({mode:'ask',question});
  } catch(e) {return error(e.message||'KI-Anfrage fehlgeschlagen.',500)}
};
