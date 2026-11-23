import {json,error,access,cleanTurns,readJSON,openAI} from './_shared.mjs';
const FIRST_QUESTION='Beschreibe möglichst genau, wie dein Wald in deiner Vorstellung aussieht.';
export default async(request)=>{
  if(request.method!=='POST')return error('Nur POST ist erlaubt.',405);
  const auth=access(request);if(auth.error)return auth.error;
  try{
    const body=await readJSON(request,27000);
    const turns=cleanTurns(body.turns);
    if(!turns)return error('Es fehlen Beschreibungen.');
    if(turns[0].question!==FIRST_QUESTION)return error('Bitte starte die Traumreise neu.');
    const b=body.blueprint;
    if(!b || typeof b.scene!=='string' || b.scene.length>7000 || !Array.isArray(b.must_show)||!Array.isArray(b.must_not_show)||!Array.isArray(b.uncertain))return error('Der Bildplan fehlt.');
    const blueprint={scene:b.scene,must_show:b.must_show.filter(x=>typeof x==='string'&&x.length<500).slice(0,25),must_not_show:b.must_not_show.filter(x=>typeof x==='string'&&x.length<500).slice(0,30),uncertain:b.uncertain.filter(x=>typeof x==='string'&&x.length<500).slice(0,10)};
    const must=blueprint.must_show.slice(0,25).map(x=>'- '+x).join('\n');
    const absent=blueprint.must_not_show.slice(0,30).map(x=>'- '+x).join('\n');
    const uncertain=blueprint.uncertain.slice(0,10).map(x=>'- '+x).join('\n');
    const prompt=`Erstelle EINE individuelle, hochwertige, handgezeichnete und farbig kolorierte WALDSKIZZE im Querformat, als anschauliche Schulbuch-Naturillustration mit klaren, feinen Umrisslinien, zusammenhängender räumlicher Tiefe und natürlicher Perspektive. Stil: zweidimensionale detailreiche Landschaftszeichnung wie ein gut gezeichnetes Naturkundebild; nicht fotorealistisch, keine 3D-Icons, keine Emojis, kein Clipart, keine Schicht-Trennlinien und keinerlei Schrift oder Beschriftung. KLAR ERKENNBARE BÄUME und Tiere statt abstrakter Flecken. Nicht immer denselben Standardregenwald darstellen. Bildkomposition und Farbigkeit müssen spezifisch auf der folgenden Vorstellung basieren. Besondere Aufmerksamkeit für unübliche Details und genaue Mengen.

VERBINDLICHE SZENE:
${String(blueprint.scene).slice(0,7000)}

DIESE EINZELDETAILS MÜSSEN SICHTBAR SEIN:
${must||'- Nur die beschriebenen sichtbaren Einzelheiten.'}

DIESE DINGE UNBEDINGT NICHT ERGÄNZEN:
${absent||'- Keine unerwähnten Tiere, Büsche, Lianen, Farne oder dichte Bodendecke hinzudichten.'}

UNSICHERE ALLTAGSSPRACHE WORTGETREU UMSETZEN:
${uncertain||'- Keine weiteren.'}

Die folgenden ORIGINALAUSSAGEN der Schülerin/des Schülers sind der wichtigste Abgleich. Gib ihrer konkreten Bedeutung Vorrang vor Stereotypen: 
${turns.map((t,i)=>`Antwort ${i+1}: ${t.answer}`).join('\n')}

Wichtige Schlussprüfung: Bodenfarbe, Bodennässe, Bodenbewuchs, Lichtverhältnisse oben/unten, Baumanzahl, Baumgrößen, Blattgrößen und -farben, Lianen/Äste, Tierart und Tierfarbe exakt beachten. Alles bildlich Erzählte darf vorkommen, selbst wenn es biologisch oder geografisch unmöglich ist. Wenn ein Kind etwas ausdrücklich verneint, nicht einzeichnen. Erzeuge eine ausdrucksstarke, ablesbare, echte Szene statt isolierter Sticker.`;
    const data=await openAI('images/generations',auth.apiKey,{
      headers:{'content-type':'application/json'},
      body:JSON.stringify({model:process.env.IMAGE_MODEL||'gpt-image-2.5-flare',prompt,size:'1280x832',quality:'medium',output_format:'webp',output_compression:72,n:1})
    },55000);
    const b64=data?.data?.[0]?.b64_json;
    if(!b64)throw new Error('Die Bild-KI hat kein Bild zurückgegeben.');
    if(b64.length>6_000_000)throw new Error('Das Bild ist zu groß. Bitte versuche es erneut.');
    return json({image:'data:image/webp;base64,'+b64,checklist:blueprint.must_show.slice(0,18)});
  }catch(e){return error(e.message||'Das Bild konnte nicht erstellt werden.',500)}
};
