MEIN WALD - Traumreise-KI (Schulprojekt)
======================================

WAS IST IN DIESEM PROJEKT?
- public/index.html: große, einfache Oberfläche für iPads
- netlify/functions/next.mjs: adaptive Rückfragen, maximal 3 insgesamt
- netlify/functions/transcribe.mjs: gesprochene Antworten in Text
- netlify/functions/plan.mjs: genaue Bildbeschreibung aus Schülerantworten
- netlify/functions/image.mjs: echte, individuelle KI-Illustration
- netlify.toml: Einstellungen für Netlify

WICHTIG:
Das ist eine echte Online-KI-Anwendung, keine Offline-HTML-Demo.
Die Dateien alleine erzeugen keine Bilder. Nötig sind ein Netlify-Projekt
mit aktiven Functions sowie ein separater OpenAI-API-Zugang mit Guthaben.

EINRICHTEN:
1. Projektordner bei Netlify als neue Site bereitstellen. Für die
   Serverfunktionen Git-Deployment oder Netlify CLI verwenden; ein
   reiner statischer Dateiupload reicht NICHT aus.
2. In den Netlify-Einstellungen unter Environment variables setzen:
     OPENAI_API_KEY   = dein geheimer OpenAI-API-Schlüssel
     KLASSEN_CODE     = ein selbst gewählter längerer Code, z.B. eine
                        zufällige Zeichenfolge, nicht das Passwort eines Kontos.
   Nie den API-Schlüssel in public/index.html eintragen!
3. Nach dem Setzen der Variablen eine neue Veröffentlichung auslösen.
4. Im Browser testen: https://DEINE-SITE.netlify.app/#klasse=DEIN_CODE
5. Aus dieser Adresse einen QR-Code erstellen. Auf den Schüler-iPads
   ist dann keine Anmeldung und kein eigenes Eintippen des Codes nötig.

DIESE API-MODELLE SIND VOREINGESTELLT:
   TEXT_MODEL        gpt-5-mini
   TRANSCRIBE_MODEL  gpt-transcribe
   IMAGE_MODEL       gpt-image-2.5-flare
Sie können bei Bedarf als zusätzliche Netlify-Umgebungsvariablen
geändert werden.

ABLAUF:
- Immer zuerst die offene Beschreibungsfrage.
- Maximal 2 gezielte Nachfragen, manchmal keine.
- Antworten sprechen und nach der Transkription kurz prüfen.
- Am Ende erzeugt ein Bildmodell eine neue Zeichnung, keine Emoji-Szene.
- Es gibt keinen Bilddownload und keine Schulnoten/Feedback.

DATENSCHUTZ UND KOSTEN:
- Sprachaufnahmen werden über die Netlify-Serverfunktion zu OpenAI
  zur Transkription übertragen. Die Texte werden zur Fragenplanung
  und Bildgenerierung übertragen.
- Die Seite selbst legt keine Antwortdatenbank an und verwendet
  kein eigenes Tracking. Eine Verarbeitung bei Netlify/OpenAI findet
  aber statt; deren Richtlinien und technische Protokolle beachten.
- Vor dem Einsatz mit Minderjährigen: schulische Freigabe,
  Datenschutzhinweise, Auftragsverarbeitung und Zuständigkeiten klären.
  Keine Namen oder sonstige personenbezogene Informationen erfassen.
- Ein öffentlicher Link und Klassencode bieten keine vollständige
  Kostensicherheit. Ein Projektbudget und eine Nutzungsgrenze im
  API-Konto einrichten. Jede Bildgenerierung ist kostenpflichtig.
- Für Safari und iPad wird MediaRecorder verwendet; die Funktion ist
  auf einem echten Schul-iPad, mit HTTPS und Mikrofonfreigabe, zu testen.
  Ohne Mikrofon kann auch getippt oder die iPad-Diktierfunktion genutzt werden.

FUNKTIONSLIMITS:
Netlify Functions haben ein Zeitlimit. Auch echte Bild-KI kann dadurch
in Einzelfällen abbrechen. In dem Fall ist „Bild neu versuchen“ vorgesehen.

KEINE GARANTIE VOLLSTÄNDIGER BILDTREUE:
Sprachverständnis, exakte Anzahlen und Bildwiedergabe können fehlerhaft sein.
Die KI soll nicht korrigieren, aber wir können kein perfektes Bild garantieren.
