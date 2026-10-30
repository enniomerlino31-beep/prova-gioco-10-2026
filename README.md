# Prova gioco

Un piccolo gioco di corsa e gestione ambientato in una segheria di montagna, dove il giocatore gestisce boscaioli, legna, carne e vendite per sopravvivere alla foresta e alle sfide finali.

## 💡 Idea del gioco

Il gioco unisce una corsa infinita con una base di gestione: la squadra corre in foresta, attraversa porte con bonus o penalità e affronta ostacoli, lupi e una salita finale. Durante la corsa si raccolgono legna e carne, mentre nella segheria si vendono risorse, si guadagnano soldi e si costruisce il progresso del giocatore. La visione completa del progetto è quella di un gioco ispirato alla meccanica di Count Masters, con un tema di boscaioli, montagna innevata e segheria assediata.

## 🧭 Stato attuale

### Cosa funziona già oggi

Questa è la descrizione breve di come funziona il gioco oggi. Il testo lungo e dettagliato di ogni punto (con tutti i numeri e le prove fatte) è in [ARCHIVIO.md](ARCHIVIO.md); i numeri veri sono in `src/config.js`.

**Il gioco in generale**
- Tre modalità: menu, segheria (la base) e corsa. Il progresso (soldi, legna, carne, miglioramenti, tutorial, livello dell’orso) è salvato nel browser con localStorage; le impostazioni dell’audio stanno in una memoria separata. Il gioco usa Three.js e Vite.
- Aspetto in stile cartoon caldo: personaggi con testa grande e tonda, animazioni morbide (rimbalzi, respiro, neve sollevata dai passi, impronte che sbiadiscono), icone disegnate dal gioco (niente emoji). È leggero per il telefono: i pezzi che si muovono insieme sono uniti in una forma sola (`src/modelli/pezzi.js`) e le cose ripetute (pali, impronte, pietre, fumo) si disegnano in un colpo solo.

**La base (segheria)**
- Una radura nella foresta innevata, circondata da mura di pali verticali (circa 22 × 15 m). Il boscaiolo (joystick, mouse/touch o tastiera) non può attraversarle; esce dai tre cancelli, che si aprono da soli: quello della **corsa** in alto al centro (davanti alla segheria), quello della **foresta** a sinistra e quello di **destra**.
- Ordine della base: a sinistra la colonna della LEGNA (catasta, deposito con rastrelliera, sportello), a destra la colonna della CARNE (banco da lavoro del cacciatore, deposito con tavolo, sportello), al centro una corsia libera. Tra i due sportelli c’è il **cerchio delle monete**, con un cartellino col numero. I cerchi dei miglioramenti compaiono accanto a quello che comprano e non si sovrappongono a niente.
- Il boscaiolo porta tutto senza limiti, in tre pile sulla schiena una dietro l’altra (legna, carne, monete); i numeri veri stanno sopra. Colpisce i lupi con l’ascia (spazio o E): carica il colpo e lo cala di scatto.
- **Economia** (`CONFIG.economia`): legna 2 monete, carne 5. I clienti arrivano di continuo dal basso e fanno la fila ai due sportelli (uno su cinque vuole carne); pagano nel cerchio delle monete, da raccogliere passandoci sopra. All’inizio (prima delle mura di pietra) arrivano un po’ più in fretta. Con i venditori c’è una probabilità di mancia.
- **La segheria (edificio)** (`src/modelli/segheria.js`): capanno di tronchi con tetto di neve e ghiaccioli, camino che fuma, finestre calde, lanterna e insegna; di lato, sotto una tettoia, una sega circolare con un tronco che avanza e la segatura. **Cambia insieme alle mura** (legno: capanno semplice; pietra: basamento e camino di pietra; metallo: angoli e cerniere di ferro e lama più grande e lucida) e ha lo stesso aspetto anche in cima alla salita della corsa.

**Mura, lupi e difesa**
- **Mura**, 3 livelli: legno (vita 360), pietra (250 monete, vita 800), rinforzo in metallo (600 monete, vita 1500). Ogni livello ripara tutto; le parti nuove compaiono con un’onda che fa il giro della base. Man mano che la vita scende i pali si rovinano (crepe, schegge, punte rotte, pali spezzati) e a ogni morso il palo trema.
- **Mura che cedono e cadono** (`CONFIG.muraAllarme`): sotto il 25% compare “Le mura stanno cedendo! Riparale!” (al massimo ogni 30 secondi). A zero **la partita è persa**: schermata “Le mura sono cadute!” con “Ricomincia”, che cancella tutto tranne il tutorial (non si rifà) e le impostazioni audio. Mentre si è via o in corsa le mura non perdono vita.
- **Cerchio verde di riparazione**: sotto il 25% compare al centro esatto della base un grande cerchio verde (raggio 3 m): si portano **50 legna** e le mura tornano al massimo. Compare con un’esplosione, la telecamera lo mostra per 2 secondi, e i cerchi che si sovrappongono si nascondono finché c’è.
- **Lupi**: non arrivano finché non si comprano le mura di pietra. All’inizio pochi lupi deboli; con la torretta sinistra si apre il lato sinistro, con la destra il lato destro (gruppi che crescono col tempo, numeri in `CONFIG.segheria`). Un lupo normale ha 15 punti di vita (3 colpi d’ascia o 5 frecce), gira attorno alle mura e le morde da fuori; morendo lascia 1 o 2 di carne a terra.
- **Lupo gigante** (`CONFIG.lupoGigante`): ogni 2-3 minuti dopo la prima torretta. 400 punti di vita con una grande barra, più veloce (1,5), morde ogni 0,5-0,8 s per 8 punti ma **non toglie mai più del 25% della vita massima delle mura** in tutto il suo attacco. All’arrivo la telecamera lo inquadra, ulula e compare “Arriva il lupo gigante!”; mentre c’è suona una musica inquietante. Morendo lascia 10 di carne.

**I miglioramenti** (cerchi verdi: si sta sopra e si pagano le monete; mostrano solo il prossimo acquisto di ogni fila, `CONFIG.file`)
- Fila **DIFESA**: Mura di pietra (passaggio del tutorial), Torretta sinistra 1, Torretta destra 1, Torretta sinistra 2, Torretta destra 2, Riparazione 1, Rinforzo in metallo, Riparazione 2, Potenzia arcieri 1 e 2, Riparazione 3.
- Fila **ECONOMIA**: due cerchi che vanno **a coppie** (aiutante e venditore; cacciatori), che compaiono quando c’è il banco del cacciatore, poi i potenziamenti; infine il **Boscaiolo secondario** (5000 monete) come ultimo acquisto. Il **Pavimento in pietra** (300 monete) compare dopo aver assunto aiutante, venditore e cacciatore.
- Se quello che si compra è lontano, la telecamera ci va dolcemente, mostra la costruzione e torna sul boscaiolo (che intanto sta fermo).
- **Torrette**: quattro torri (due per lato; 150 e 250 monete) con un arciere che tira ogni 1,6 s solo sul suo lato (gittata 8 m, 9 e 10 con “Potenzia arcieri” 1 e 2). L’aspetto della parte bassa segue il materiale delle mura; la parte alta, l’arco e l’armatura seguono gli arcieri.
- **Riparazione** (100 → 200 → 400): le mura si riparano da sole, piano piano.
- **Aiutante** (120): porta la legna dalla catasta allo sportello (20 unità per viaggio). **Cacciatori** (200 e 300; esperto 400): ognuno difende un lato, esce dal suo cancello, uccide i lupi, raccoglie la carne (30 unità per viaggio) e la porta al tavolo dello sportello CARNE; con tutte e quattro le torrette raccolgono soltanto. **Venditori** (100 → 200 → 400): stanno dietro il bancone e servono i clienti più in fretta.
- **Boscaiolo secondario**: con il berretto viola e una slitta, esce dal cancello della corsa e ogni **5 minuti** riporta **40 legna** sulla catasta (con un conto alla rovescia accanto al cancello); lavora anche durante le corse e quando il gioco è chiuso.
- **Pavimento**: da neve a lastre di pietra con un’animazione che si espande dal punto d’acquisto. Il **banco del cacciatore** compare con le mura di pietra.

**Suoni e musica** (`src/motore/suoni.js`, elenco e fonti in [CREDITI-SUONI.md](CREDITI-SUONI.md))
- File audio veri CC0 in `public/suoni/` (circa 2 MB), morbidi e rilassanti: passi, ascia, lupi, monete, vendite, cancelli, costruzioni legate al materiale, corsa, orso, grida dei boscaioli e feste. Una sola musica (ukulele) per tutto il gioco, sempre più bassa degli effetti; una musica inquietante col lupo gigante e con l’orso. Volumi in `CONFIG.audio`; limite di suoni uguali insieme e compressore; l’audio parte al primo tocco sul telefono. L’ingranaggio in alto a sinistra apre le impostazioni (effetti e musica), con il gioco in pausa.

**Guadagni mentre si è via** (`src/segheria/offline.js`, numeri in `CONFIG.offline`)
- Riaprendo il gioco la base ha lavorato: si vende **solo la legna portata dal boscaiolo secondario** (più la carne già sul tavolo), con i ritmi veri di aiutante, venditori e clienti, circa **975 monete all’ora** con il boscaiolo secondario. Niente sotto i 2 minuti, al massimo 24 ore, niente durante il tutorial; i lupi non fanno danni. Compare “Bentornato!” con il tempo, la legna e le monete e il pulsante “Raccogli”. L’orologio non torna mai indietro (nessun guadagno doppio).

**Tutorial** (solo alla prima partita): tre passaggi con messaggio giallo e freccia (1. prima corsa, 2. porta la legna allo sportello, 3. compra le mura di pietra), tutti gli altri cerchi spenti; alla fine una festa con “Gioca”. Chi aveva già fatto una corsa non lo vede.

**La corsa**
- Una squadra di boscaioli con un carro corre su una pista di 600 m: la squadra segue il dito (movimento morbido a molla), la telecamera si allarga per inquadrare folla e carro. Oltre 120 omini se ne disegnano solo 120, ma i numeri sono quelli veri.
- **Porte**: 10 coppie per corsa, “+”, “−”, “×”, “÷”, più generose nella seconda metà; in 2 coppie su 10 sono **rosse** (tutte e due tolgono boscaioli). **Alberi**: si abbattono per la legna (12 pezzi l’uno, circa 35 per corsa); rocce e lupi fanno perdere boscaioli o carico.
- **Orso gigante** (`src/corsa/orso.js`, `CONFIG.orso`): in fondo alla pista, prima della scalinata. Scontro automatico e movimentato: i boscaioli lo circondano, saltano, volano via colpiti, la telecamera trema; ogni 4 attacchi schianta a terra, sotto il 30% è furioso, l’ultimo colpo va al rallentatore. 300 punti di vita al livello 1, +8% a ogni livello; dopo la vittoria sale di livello e non compare per 3-5 corse; nella prima corsa non c’è. Se vince l’orso si porta a casa solo la legna degli alberi. Se cade, dopo la scalinata si aggiungono 100 di carne.
- **Scalinata** fino a ×20: più gradini si salgono, più il bottino si moltiplica; il costo di un gradino (boscaioli che restano indietro) cresce con il gradino e con il peso del carro (`CONFIG.salita`).
- A fine corsa c’è il riepilogo con vittoria o sconfitta e il bottino.
- **Avvio senza scatto**: la corsa si costruisce (porte, alberi, scritte, colori per la scheda grafica) quando il boscaiolo arriva a 5 metri dal cerchio CORSA (`DISTANZA_PREPARA_CORSA` in `segheria.js`, `preparaCorsaInAnticipo` in `main.js`); se si allontana, la corsa preparata si butta; se parte, si usa quella già pronta. Prima lo scatto (circa 0,3 secondi con la CPU 4 volte più lenta) era proprio all’avvio della corsa; adesso è un singolo fotogramma lungo mentre si cammina verso il cerchio.
- **Dettaglio dello schermo**: il gioco disegna al massimo 1,5 pixel per ogni punto dello schermo (`CONFIG.grafica.pixelMassimi` in `config.js`; prima 2). Sui telefoni molto nitidi (3 pixel per punto) l’immagine è un po’ meno nitida ma c’è meno lavoro per la scheda grafica; per tornare a com’era basta mettere 2.

### Cosa è ancora da fare

- Il nome definitivo del gioco non è stato scelto ancora.
- La struttura completa delle “basi” e dei progressi multipli non è ancora stata portata a termine: nel codice attuale si vede una segheria, ma non ancora diversi insediamenti o livelli di base da sbloccare.
- La fase di “corsa infinita” è presente in logica e meccanica, ma non ancora pienamente espansa come una struttura di mondo infinito e di avanzamento completo.
- Non esiste ancora una schermata di selezione di base o di avanzamento tra più aree di gioco.
- La parte estetica, l’equilibrio del gioco e la narrazione potrebbero essere ulteriormente sviluppate.
- Il progetto è ancora in fase di prototipo e di testing di meccaniche base.
- **Gruppi di modifiche**: i Gruppi 1, 2, 3, A, B, C, 4 e 5 sono fatti, provati e approvati dall’utente e salvati (elenco in `PIANO-GRUPPI.md`, storia completa in `ARCHIVIO.md`).
- **Prossimi gruppi (piano del 2026-10-30, non ancora iniziati)**: 6 avvisi e mini tutorial; 7 nuova economia (catasta con limite, venditore della legna gratuito, cantieri); 8 giornata e personale (paga, menu, stanchezza); 9 zona lavorazione legna; 10 affumicatoio; 11 zona clienti. Il testo completo è in `PIANO-GRUPPI.md`.
- **Dopo i gruppi** verranno le espansioni della base (zona clienti con falò, affumicatoio, canile, casa dei lavoratori, grande magazzino), descritte in `PIANO-ESPANSIONI.md` e non ancora realizzate.

## 🎮 Comandi di gioco

I controlli usati nel codice sono questi:

- Mouse o dito: premi e trascina verso sinistra o destra per spostare il personaggio o la squadra durante la corsa.
- Tastiera: frecce sinistra/destra oppure tasti A/D.
- Schermata iniziale: cliccare il pulsante “Gioca”.
- Dopo una corsa: cliccare il pulsante “Alla segheria” per tornare alla base.
- Nella segheria: il giocatore si muove con il joystick virtuale su schermo o con il mouse/touch e tastiera. Le mura lo bloccano; per uscire basta avvicinarsi a un cancello, che si apre da solo.
- Per raccogliere o vendere risorse: avvicinarsi alle zone giuste della segheria (catasta, cerchio giallo del deposito di uno sportello, cerchio delle monete tra i due sportelli). Allo sportello LEGNA si scarica solo la legna, allo sportello CARNE solo la carne.
- Per comprare un miglioramento: stare sul cerchio verde (della fila DIFESA o ECONOMIA, o del pavimento) finché la barra dorata non è piena; il numero nel cerchio dice quante monete mancano (servono le monete in tasca; se finiscono, quelle già messe restano nel cerchio). Torrette, cacciatori, venditori e riparazione poi lavorano da soli, senza bisogno di comandi. Se dopo l’acquisto la telecamera va a mostrare il miglioramento, il boscaiolo resta fermo per qualche secondo finché la telecamera non torna.
- Per ricominciare da zero: aprire il gioco con `?reset` alla fine dell'indirizzo (per esempio `http://localhost:5173/?reset`). Il salvataggio viene cancellato (soldi, legna, carne, miglioramenti, tutorial) e il gioco riparte come la prima volta, tutorial compreso. Poi `?reset` sparisce da solo dall'indirizzo, così ricaricando la pagina non si cancella di nuovo tutto. Attenzione: non si può tornare indietro.
- Per rivedere il tutorial: aggiungere `?tutorial` all’indirizzo del gioco (per esempio `http://localhost:5173/?tutorial`). Riparte dal primo passaggio senza cancellare i progressi.
- Per saltare il tutorial: aggiungere `?senzatutorial` all’indirizzo (per esempio `http://localhost:5173/?senzatutorial`). Il tutorial risulta finito (e resta salvato così): tutti i cerchi sono subito accesi. Utile per provare una partita nuova su un indirizzo mai usato senza rifare il tutorial. I lupi arrivano comunque solo dopo aver comprato le mura di pietra.
- Per provare gli acquisti senza guadagnare le monete: aggiungere `?moneteinfinite` all’indirizzo (per esempio `http://localhost:5173/?reset&senzatutorial&moneteinfinite`). Le monete in tasca tornano sempre a 999.999, quindi tutti i cerchi si pagano subito. Resta finché c’è nell’indirizzo; le monete però restano salvate, quindi per tornare a una partita normale conviene ricominciare con `?reset`.
- Per provare il boscaiolo secondario: aggiungere `?tuttocomprato` all’indirizzo (per esempio `http://localhost:5173/?reset&tuttocomprato`). Risultano già comprati tutti i miglioramenti tranne il boscaiolo secondario, con 5000 monete in tasca, e il tutorial risulta finito: si vede solo il cerchio del boscaiolo secondario. Attenzione: cambia la partita salvata. Poi `?tuttocomprato` sparisce da solo dall’indirizzo.
- Per provare i guadagni di quando si è via senza aspettare: aggiungere `?offline=N` all’indirizzo, dove N sono i minuti di assenza finti (per esempio `http://localhost:5173/?offline=60` finge di essere stati via 60 minuti). Valgono le stesse regole vere (niente sotto i 2 minuti, al massimo 24 ore, niente durante il tutorial). Poi `?offline` sparisce da solo dall’indirizzo, così ricaricando la pagina non conta di nuovo.
- Per togliere o rimettere i suoni: toccare l’ingranaggio in alto a sinistra e usare gli interruttori “Effetti sonori” e “Musica” (restano salvati; il gioco sta in pausa finché il menu è aperto).
- Per provare la corsa subito: aggiungere `?corsa` all’indirizzo (per esempio `http://localhost:5173/?senzatutorial&corsa`): premuto “Gioca”, parte subito una corsa. Poi `?corsa` sparisce da solo.
- Per provare lo scontro con l’orso: aggiungere `?orso=LIVELLO&boscaioli=NUMERO` all’indirizzo (per esempio `http://localhost:5173/?senzatutorial&orso=5&boscaioli=200`): dopo “Gioca” parte una corsa vicino alla fine, con quei boscaioli (se non si scrive `boscaioli`, 100), 200 legna e 20 carne sul carro, e l’orso di quel livello. Con `&legna=NUMERO` si sceglie la legna sul carro (per esempio `&legna=3000` per vedere la pila di tronchi al massimo). Con `?orso=0&boscaioli=1500` non c’è l’orso e si prova solo la scalinata alta. **Le prove non toccano la partita salvata** (niente bottino, l’orso non cambia livello). Poi `?orso` e `?boscaioli` spariscono da soli.
- Per provare il lupo gigante subito: aggiungere `?gigante` all’indirizzo (per esempio `http://localhost:5173/?tuttocomprato&gigante`): dopo “Gioca” arriva dopo 3 secondi, con la telecamera, l’ululato e la scritta. Poi `?gigante` sparisce da solo.
- Per provare le mura che cedono o cadono: aggiungere `?mura=N` all’indirizzo, dove N è la vita delle mura in percentuale (per esempio `?tuttocomprato&mura=20` fa comparire subito l’avviso “Le mura stanno cedendo!”, `?tuttocomprato&mura=0` le fa cadere e compare “Ricomincia”). Attenzione: “Ricomincia” cancella davvero la partita salvata. Poi `?mura` sparisce da solo.
- Per provare la base con tanti lupi insieme (serve per misurare la velocità): aggiungere `?lupi=N` all’indirizzo, dove N è il numero di lupi normali che devono esserci sempre in giro, da 1 a 12 (per esempio `http://localhost:5173/?reset&tuttocomprato&gigante&lupi=12`). Appena un lupo muore ne arriva un altro, da punti a caso della foresta. Poi `?lupi` sparisce da solo dall’indirizzo. Solo per le prove.
- Per partire per una corsa: stare sul cerchio blu “CORSA” davanti al cancello in alto al centro (quello davanti alla segheria).
- Difesa base: premere spazio o il tasto E quando si è vicino a un lupo per colpirlo con l’ascia; richiede un breve cooldown tra un colpo e l’altro.
- Durante la corsa: evitare rocce e lupi e usare le porte in modo da tenere la squadra abbastanza numerosa per arrivare alla sfida finale.

## ▶️ Come avviarlo sul proprio computer

1. Apri il terminale o il prompt dei comandi dentro la cartella del progetto.
2. Installa le dipendenze:

```bash
npm install
```

3. Avvia il gioco in modalità sviluppo:

```bash
npm run dev
```

4. Vite aprirà normalmente un indirizzo locale come `http://localhost:5173` o un altro indirizzo mostrato nel terminale.
5. Apri quel link nel browser e il gioco partirà.

Per creare una versione pronta da distribuire:

```bash
npm run build
```

## 🌐 Il gioco online

**Indirizzo da mandare agli amici (si apre nel browser del telefono, niente da installare):**

https://enniomerlino31-beep.github.io/prova-gioco-10-2026/

- Il gioco online è pubblicato con **GitHub Pages**: a **ogni commit su `main`** GitHub lo ricostruisce e lo aggiorna da solo, in circa 1-2 minuti (il file è `.github/workflows/pubblica.yml`; si può anche rilanciare a mano da GitHub, scheda **Actions**, “Pubblica il gioco online”, “Run workflow”).
- **Il salvataggio è sul telefono di ognuno** (nel browser): ogni persona ha la sua partita, che non si sposta tra telefoni; cancellando i dati del sito o usando la navigazione privata si ricomincia da zero.
- **I comandi di prova** (`?reset`, `?moneteinfinite`, `?tuttocomprato`, `?offline`, `?lupi`...) **online non fanno niente**: la costruzione online imposta `VITE_SENZA_PROVE` e `main.js` toglie subito tutto quello che c’è dopo il `?`. Sul computer, con `npm run dev`, funzionano come sempre.
- Le foto di riferimento delle mura (`public/riferimenti/`) restano nel repository ma **non vanno online**.
- Suoni, musica, salvataggio e guadagni mentre si è via funzionano anche online (provato con la costruzione online servita da una sottocartella, come fa GitHub). Il gioco ha bisogno di internet solo per scaricarsi e per il carattere dei titoli (Google Fonts).
- **Una volta sola, nelle Impostazioni di GitHub** (serve per attivare Pages): aprire il repository su GitHub → **Settings** (Impostazioni) → nel menu a sinistra **Pages** → sotto “Build and deployment”, in **Source** scegliere **GitHub Actions**. Poi, nella scheda **Actions**, aspettare il segno verde della prima pubblicazione.
- Come provare la costruzione online sul proprio computer: `BASE_PERCORSO=/prova-gioco-10-2026/ VITE_SENZA_PROVE=1 npm run build` e poi `npx vite preview` con la stessa `BASE_PERCORSO`.

## 🛠️ Tecnologie usate

- JavaScript
- HTML
- CSS
- Vite
- Three.js
- localStorage per il salvataggio del progresso

## 📁 Struttura dei file

- `index.html`: struttura della pagina, HUD, avviso al centro dello schermo e schermate del gioco.
- `PIANO-ESPANSIONI.md`: il piano delle 5 espansioni del livello 1 (meccanismo comune e cosa fa ogni zona), da realizzare in futuro una alla volta.
- `PIANO-GRUPPI.md`: lo stato dei gruppi di modifiche (tutti fatti e salvati), in breve, e le note già decise che servono per lavorare sul codice.
- `ARCHIVIO.md`: la storia dei gruppi finiti, la descrizione lunga di com’era il gioco e il registro modifiche completo. **Non serve leggerlo a ogni sessione**: tutto quello che è stato tolto dal README e dal piano per accorciarli è qui.
- `src/segheria/cerchioRiparazione.js`: il grande cerchio verde per riparare le mura con la legna (esplosione, pulsazione e alone).
- `src/corsa/orso.js`: lo scontro con l’orso gigante (ruggito, ondate di boscaioli, zampate, caduta) e la vita dell’orso per livello; `src/modelli/orso.js`: il modello dell’orso e le sue animazioni.
- `src/segheria/barraGigante.js`: la grande barra della vita del lupo gigante (un cartellino disegnato in stile cartoon, sempre visibile sopra la testa).
- `CREDITI-SUONI.md`: l’elenco di tutti i suoni e le musiche con la fonte e la licenza (CC0).
- `public/suoni/`: gli 89 file mp3 dei suoni, delle grida e delle musiche (circa 2,0 MB in tutto; dodici sono dell’orso).
- `public/favicon.svg` e `public/apple-touch-icon.png`: l’icona della scheda del browser (un’ascia piantata in un ceppo, in stile cartoon, con il cielo del gioco dietro) e la sua versione quadrata 180×180 per la schermata iniziale dell’iPhone; sono collegate in `index.html`.
- `public/riferimenti/`: le tre foto di riferimento per le nuove mura del Gruppo 2 (struttura, distanza tra i pali, aspetto del legno).
- `src/main.js`: punto di partenza del gioco e loop principale.
- `src/config.js`: tutte le impostazioni principali: velocità, numero di boscaioli, porte, ostacoli, economia e telecamera.
- `src/corsa/`: logica della corsa: squadra, carro, alberi, porte, lupi, ostacoli e sfida finale.
- `src/segheria/`: la logica della base: mappa, palizzata e muri (`ambiente.js`), giocatore, catasta, sportelli, clienti, cerchio delle monete (`soldi.js`), mura a pali con i 3 livelli e i danni (`mura.js`), cancelli, pavimento, cerchi dei miglioramenti (`miglioramenti.js`), aiutante, cacciatori e banco, venditori, boscaiolo secondario (`secondario.js`), guadagni offline (`offline.js`), torrette (`torrette.js`), cerchio verde di riparazione, barra del lupo gigante, tutorial, e il file principale `segheria.js` (lupi, telecamera, risorse, le due file di acquisti).
- `src/motore/`: controlli, input, effetti grafici e gestione della scena, e i suoni (file veri CC0 con limite di volume, musica e dissolvenze) (`suoni.js`; il pulsante dell’audio si collega in `main.js`).
- `src/modelli/`: i modelli 3D: `segheria.js` (l’edificio della segheria con i tre aspetti e le animazioni), `boscaiolo.js` (anche `creaLavoratore` per i lavoratori e gli arcieri), `cliente.js`, `lupo.js`, `orso.js`, `torretta.js`, `banco.js`, `sportello.js`, `carro.js`, `porta.js`, `materiali.js` (colori, il legno della palizzata, scritte e icone), `pezzi.js` (unisce i pezzi in poche forme, leggero sul telefono) e `animazioni.js`.
- `src/motore/effetti.js`: oggetti che volano, sbuffi di particelle, polvere di neve sotto i piedi, scintille luminose e impronte (`src/motore/impronte.js`: impronte di stivale e di zampa che sbiadiscono).
- `src/segheria/neveATerra.js`: il terreno innevato (onde leggere, sfumature, dune verso la foresta, mucchietti e scintillio).
- `src/schermate/`: interfaccia, HUD e barra della vita delle mura.
- `src/salvataggio.js`: salvataggio del progresso nel browser.
- `src/economia.js`: logica delle vendite e del denaro.
- `stile.css`: fogli di stile grafico e UI del gioco.
- `public/base/`: immagini dei livelli della base (`base-livello-1/2/3.webp`), caricate dall’interfaccia in `src/schermate/schermate.js`.
- `vite.config.js`: configurazione di Vite (con `base`, la sottocartella dell’indirizzo online, da `BASE_PERCORSO`).
- `.github/workflows/pubblica.yml`: la pubblicazione automatica del gioco online con GitHub Pages.
- `package.json`: script del progetto e dipendenze.

## 📝 Registro modifiche

Qui ci sono le ultime modifiche. **Il registro completo, dall’inizio, è in [ARCHIVIO.md](ARCHIVIO.md).**

- 2026-10-27 — Gruppo 4 (da provare): corsa con 10 coppie di porte più generose nella seconda metà (×3, ×4, ×5, somme grandi) e 2 coppie rosse con una porta che toglie un numero fisso e una che divide (mai nella prima coppia né nel tutorial), quasi il doppio degli alberi (legna da 12 a 16 per albero), meno rocce e lupi (`generatoreLivello.js`, `CONFIG.porte`, `CONFIG.livello`); orso gigante a fine corsa con scontro automatico a ondate, barra della vita, zampate, caduta e musica paurosa (`orso.js`, `modelli/orso.js`, `CONFIG.orso`), livello e corse mancanti salvati (`preparaCorsa`, `registraOrso` in `segheria.js`), 100 carne dell’orso dopo la scalinata, solo legna se l’orso vince, niente orso nel tutorial; scalinata fino a ×20 con costi ricalcolati (`CONFIG.salita`); 4 suoni nuovi CC0 (ruggito, zampata, colpi, caduta); nuovo `?orso=LIVELLO&boscaioli=NUMERO`. Suoni: 83 file, circa 1,8 MB.
- 2026-10-27 — Gruppo 4, correzioni dopo la prima prova (da riprovare): orso con il 50% di vita in più (300 al livello 1) e zampate più forti (3% della vita, almeno 8); ruggito sostituito con la registrazione di un orso nero vero (CC0); la pila di tronchi sul carro non esce più dai bordi (non si allarga più, 5 tronchi nella fila più larga, tronchi più corti, smette di crescere a 36 tronchi = 288 legna; il numero vero della legna non cambia); musica paurosa dello scontro: si scarica e si prepara all’inizio di ogni corsa (prima, se il gioco era appena aperto, non era ancora pronta) e si sente il doppio (`GUADAGNO_MUSICA` in `suoni.js`); grida di battaglia dei boscaioli nello scontro; `&legna=N` per le prove. Suoni: 89 file, circa 2,0 MB.
- 2026-10-27 — Gruppo 4, seconda serie di correzioni (da riprovare): orso +8% di vita a livello invece di +12% (livello 1 resta 300); economia: legna per albero di nuovo 12 e scalinata più dura (`costoBase` 14 e `crescitaCosto` 0,20), così una corsa buona vale circa 4.600 monete e ×20 è raro; guadagni offline: si vende solo la legna del boscaiolo secondario (circa 975 monete all’ora, circa 23.400 in 24 ore), la legna delle corse resta nella catasta (`offline.js`).
- 2026-10-27 — Gruppo 4, scontro con l’orso più dinamico (da provare): boscaioli a semicerchio e saltatori con l’ascia, lampo bianco e sobbalzo a ogni colpo, neve e pelo, zampate con carica visibile e boscaioli che volano ad arco e ricadono nella neve, telecamera che trema (`mondo.scuoti`), orso che cammina e si gira, schianto con onda di neve ogni 4 attacchi, furia sotto il 30%, colpo finale al rallentatore, crollo e boscaioli che esultano, barra della vita che trema; zampate ora circa 8 boscaioli al livello 1 (`boscaioliPerZampata` 0,025, minimo 7) e schianto doppio, così le probabilità di vittoria restano uguali (56% / 13%).
- 2026-10-27 — il Gruppo 4 (porte, alberi, orso gigante con scontro dinamico, scalinata ×20, correzioni su economia, offline, suoni e carro) è stato provato dall’utente e approvato.
- 2026-10-27 — Gruppo 5 (provato e approvato dall’utente; in cima alla salita finale la segheria ha lo stesso aspetto di quella della base): nuovo aspetto della segheria in `src/modelli/segheria.js` (capanno di tronchi con lo stesso legno delle mura, tetto di neve con ghiaccioli, camino che fuma, finestre calde, lanterna, insegna “SEGHERIA” sul tetto, tettoia con sega circolare, tronco che avanza e segatura); tre aspetti che seguono le mura con la stessa onda (legno: capanno semplice; pietra: basamento e camino di pietra; metallo: angoli e cerniere di ferro con i bulloni e lama più grande e lucida); `aggiornaCasa` in `segheria.js`, `casa` esposta da `ambiente.js`, `sfidaFinale.js` usa `aggiorna(dt)`; `pezzi.js` accetta geometrie pronte. Posizione, porta e sentiero invariati.
- 2026-10-27 — Gruppo 5 approvato e salvato (commit a7d4df2): in cima alla salita finale la segheria ha lo stesso aspetto di quella della base (`livelloMura` passato da `main.js` a `Corsa` e `SfidaFinale`).
- 2026-10-27 — riordino dei documenti, senza toccare il gioco: README e `PIANO-GRUPPI.md` accorciati; la descrizione lunga, i gruppi finiti e il registro completo sono stati spostati senza cancellare niente in [ARCHIVIO.md](ARCHIVIO.md).
- 2026-10-27 — controllo della velocità (da provare): nuovo comando di prova `?lupi=N` (tiene N lupi normali in giro); la corsa si prepara quando il boscaiolo si avvicina al cerchio CORSA (niente più scatto all’avvio); dettaglio dello schermo al massimo 1,5 (`CONFIG.grafica.pixelMassimi`). Provati e **non tenuti** perché non hanno dato un vantaggio misurabile: mappa delle ombre della base a 1024 e meno abeti lontani.
- 2026-10-27 — gioco online con GitHub Pages (da provare): `.github/workflows/pubblica.yml` (a ogni commit su `main`), `base` in `vite.config.js`, percorso delle immagini della base con `import.meta.env.BASE_URL` (`schermate.js`), comandi di prova spenti online (`VITE_SENZA_PROVE` in `main.js`), foto di riferimento non pubblicate; l’indirizzo è nel README, sezione “Il gioco online”.
- 2026-10-27 — icona della scheda del browser (`public/favicon.svg`, `public/apple-touch-icon.png`, collegate in `index.html`): un’ascia in un ceppo in stile cartoon; sparisce l’errore 404 di `favicon.ico`.

- 2026-10-30 — solo documenti, il gioco non è cambiato: salvato in `PIANO-GRUPPI.md` il nuovo piano dei Gruppi 6-11 (avvisi, nuova economia, giornata e personale, zona lavorazione legna, affumicatoio, zona clienti).

## ✅ Note finali

Questo README descrive il progetto così come appare nel codice attuale: sono riportate solo funzionalità già implementate, senza inventare meccaniche future come se fossero già presenti. Il gioco è ancora in fase di prototipo, ma la base giocabile, la gestione risorse e la corsa con obstacle/effects sono già concrete e testabili.
