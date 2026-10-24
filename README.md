# Prova gioco

Un piccolo gioco di corsa e gestione ambientato in una segheria di montagna, dove il giocatore gestisce boscaioli, legna, carne e vendite per sopravvivere alla foresta e alle sfide finali.

## 💡 Idea del gioco

Il gioco unisce una corsa infinita con una base di gestione: la squadra corre in foresta, attraversa porte con bonus o penalità e affronta ostacoli, lupi e una salita finale. Durante la corsa si raccolgono legna e carne, mentre nella segheria si vendono risorse, si guadagnano soldi e si costruisce il progresso del giocatore. La visione completa del progetto è quella di un gioco ispirato alla meccanica di Count Masters, con un tema di boscaioli, montagna innevata e segheria assediata.

## 🧭 Stato attuale

### Cosa funziona già oggi

- Il gioco ha un ciclo principale con tre modalità: menu, segheria e corsa.
- La schermata iniziale mostra il titolo del gioco e un pulsante per iniziare a giocare.
- La segheria è la base di gioco: il giocatore si muove con il joystick o con mouse/touch e con tastiera.
- La base è immersa in una foresta di abeti innevati, così la radura sembra davvero collocata nel bosco e non sospesa nel vuoto. Le mura misurano circa 22 × 15 metri (circa il 22% più grandi di prima), con tutto ridisposto in ordine nello spazio nuovo.
- Disposizione ordinata della base: a sinistra la colonna della LEGNA (cerchio “Aiutante”, catasta, deposito con la rastrelliera, sportello LEGNA), a destra la colonna della CARNE (cerchio delle mura, dispensa, deposito con il tavolo, sportello CARNE), al centro una corsia libera dove compare il boscaiolo. Ogni cerchio verde sta accanto al punto dove comparirà quello che compra: “Cacciatore” accanto alla casa del cacciatore, vicino al cancello della foresta; “Torretta” accanto alla prima torre, tra i due cancelli di sinistra; “Mura” e “Riparazione” vicino alle mura di fondo; “Venditore” accanto allo sportello CARNE. Nessun cerchio si sovrappone a un altro o agli edifici.
- La palizzata è continua e solida: il boscaiolo non la può attraversare e può uscire solo dai cancelli quando sono aperti. Nemmeno i lupi entrano: girano attorno alle mura e le attaccano da fuori. In alto c’è sempre la barra della vita delle mura; quando i lupi attaccano, la palizzata lampeggia.
- I lupi arrivano dall’inizio della partita (alla primissima partita solo dopo la fine del tutorial; il primo dopo circa 6 secondi) e a gruppi che escono insieme dallo stesso punto della foresta. All’inizio i gruppi sono di 1 o 2 lupi e possono esserci al massimo 3 lupi insieme; i gruppi crescono piano piano e dopo circa 5 minuti sono di 3 o 4 lupi. Ogni 70 secondi può esserci un lupo in più contemporaneamente (fino a 12). Nei primi 3 minuti i lupi sono più lenti (si parte da poco più della metà della velocità) e più radi; poi ne arriva un gruppo ogni 7–11 secondi. Tutti questi numeri sono in `src/config.js`.
- Il boscaiolo può colpire i lupi con l’ascia: l’attacco ha un feedback visibile, i lupi fanno un piccolo salto indietro e lampeggiano di bianco. Sopra ogni lupo c’è una barra della vita divisa in 5 tacche, che si accorcia a ogni colpo e diventa gialla e poi rossa. Un lupo normale ha 15 punti di vita: servono 3 colpi d’ascia (5 punti ciascuno) oppure 5 frecce della torretta (ogni freccia toglie una tacca).
- Ogni 2-3 minuti arriva il **lupo gigante**: grande il doppio, con il pelo più scuro e una barra della vita lunga sopra la testa (una striscia che si accorcia a ogni colpo e diventa gialla e poi rossa). Quando arriva compare per 2 secondi la scritta “Arriva il lupo gigante!” al centro dello schermo. È lento ma fa alle mura il triplo del danno di un lupo normale. Per ucciderlo servono 10 colpi d’ascia (del boscaiolo o del cacciatore) oppure 20 frecce; con “Potenzia arcieri” 12 frecce e con “Potenzia arcieri 2” 8, nella stessa proporzione dei lupi normali. Quando muore lascia 30 unità di carne, in 6 pezzi sparsi a terra. Ce n’è uno solo alla volta. I numeri sono in `CONFIG.lupoGigante`.
- I lupi morti lasciano della carne a terra (fuori dalle mura); il boscaiolo esce dal cancello della foresta, la raccoglie passandoci sopra e la carne va sulla sua schiena.
- Il boscaiolo non ha limiti di trasporto: porta tutta la legna e la carne che vuole (le monete vanno direttamente in tasca, anche loro senza limiti). Sulla schiena ci sono due pile, disegnate al massimo fino a una certa altezza, con sopra il numero vero (es. “x530”). Le pile grandi si spostano in pezzi più grossi, così anche centinaia di unità passano in pochi secondi.
- I due sportelli di vendita (LEGNA a sinistra, CARNE a destra) fanno parte della palizzata davanti, in basso nello schermo: la palizzata si interrompe nel punto dello sportello e riprende subito dopo, due pali grossi chiudono il varco, il bancone lo occupa e sporge un po’ verso l’esterno, sopra c’è una tettoia di assi di legno con l’insegna al centro.
- Ogni sportello ha un punto di deposito dal lato interno, un paio di metri dentro la base: una rastrelliera di legno per i tronchi e un tavolo con i ganci per la carne, con un cerchio giallo a terra. Quando il boscaiolo ci passa, la merce di quel tipo vola dalla sua schiena al deposito e resta impilata in vista.
- I clienti arrivano di continuo dal basso, uno ogni 1–2 secondi, finché le file non sono piene. Ogni sportello ha la sua fila, che si allunga lungo le mura; il primo della fila prende la merce dal bancone un pezzo alla volta (la pila si abbassa) e paga. Se il deposito è vuoto, la fila aspetta finché il boscaiolo non porta altra merce. I soldi finiscono nella pila di monete accanto al deposito, dal lato interno, da raccogliere passandoci sopra.
- Due cancelli nella palizzata di sinistra, fatti uguali: due pali grossi e più alti delle mura, la palizzata si ferma ai pali, in mezzo due ante di legno che si aprono verso l’esterno quando il boscaiolo si avvicina (da dentro o da fuori) e si richiudono quando si allontana. Quello in alto porta nella foresta; quello in basso è il cancello della corsa: restando sul cerchio blu “CORSA” davanti al cancello parte una nuova corsa.
- I miglioramenti sono cerchi verdi piatti a terra, grandi come gli altri cerchi, con dentro un’icona grande di cosa si compra e sotto il prezzo con la moneta. Stando sopra al cerchio le monete volano dentro e il bordo si riempie come una barra circolare dorata. A pagamento finito il cerchio fa un saltello e passa al livello successivo (che costa circa il doppio); se il livello successivo compare in un altro punto, il cerchio si rimpicciolisce, si sposta lì e ricompare. Quando i livelli sono finiti il cerchio sparisce. Se quello che si è comprato compare lontano o fuori dallo schermo, la telecamera ci va dolcemente, mostra l’animazione della costruzione per qualche secondo e poi torna dolcemente sul boscaiolo; intanto il boscaiolo resta fermo (e non si paga nessun cerchio). Per le mura la telecamera si alza sempre, così si vede l’onda che fa il giro della base. Se il miglioramento è già ben visibile, la telecamera non si muove. Ci sono sei catene, tre di difesa e tre di lavoratori:
  - “Mura”, 3 livelli. Base: palizzata di pali di legno appuntiti (vita 120). “Mura di pietra” (80 monete, vita 220): i pali di legno restano e alla loro base, solo sul lato esterno, spuntano rocce grigie appuntite che li sostengono e sporgono verso fuori. “Rinforzo in metallo” (160 monete, vita 360): assi di ferro scuro orizzontali con i bulloni tengono uniti i pali. Ogni livello ripara anche tutte le mura; le nuove parti compaiono con un’onda che parte dal cerchio e fa il giro della base palo dopo palo (ogni pezzo spunta con un piccolo rimbalzo e il palo fa un saltello).
  - “Riparazione” (100 → 200 → 400 monete): le mura recuperano vita da sole, lentamente (0,4 → 0,8 → 1,6 punti al secondo, mai oltre il massimo). Mentre si riparano, sui pali vicini al boscaiolo spuntano scintille verdi.
  - “Torretta” (150 → 300 monete) e poi “Potenzia arcieri” (600 → 1200 monete), nello stesso cerchio: una piccola torre di legno a cavallo della palizzata, con quattro gambe, la ringhiera e una bandierina. Sopra c’è un arciere (berretto viola, giacca verde, arco in mano) che si gira verso il lupo più vicino e, se è entro 8 metri, gli tira una freccia da solo ogni 1,6 secondi. La freccia vola ad arco e insegue il lupo; ogni freccia toglie una tacca della barra (servono 5 frecce per un lupo normale) e il lupo lampeggia; se il lupo muore prima, la freccia resta piantata nella neve per un attimo. Livello 1: torre sulle mura di sinistra, tra i due cancelli; poi il cerchio si sposta accanto alle mura di destra. Livello 2: seconda torre sulle mura di destra; lì il cerchio diventa “Potenzia arcieri”. “Potenzia arcieri”: servono 3 frecce, tirano ogni 1,2 secondi fino a 9 metri; le torri prendono una base di pietra, bandiera blu, arco scuro e frecce con le piume blu. “Potenzia arcieri 2”: servono 2 frecce, tirano ogni 0,8 secondi fino a 10 metri; le torri prendono fasce e piastre di ferro con i bulloni, bandiera d’oro, arco d’oro e frecce con la punta che brilla. Le parti nuove spuntano una dopo l’altra e la torre fa un saltello. Quando si compra un “Potenzia arcieri” la telecamera inquadra tutte e due le torri insieme (alzandosi e allontanandosi quanto serve), così si vedono entrambe le trasformazioni.
  - “Aiutante” (120): compare un boscaiolo con il berretto blu che fa sempre lo stesso giro, in linea dritta: va davanti alla catasta, prende la legna (al massimo 20 unità), la porta sul cerchio del deposito dello sportello LEGNA, la scarica sulla rastrelliera e torna alla catasta. Se la catasta è vuota aspetta lì, fermo.
  - “Cacciatore” (200 → 400 monete): un boscaiolo con il berretto verde e la giacca di pelle marrone che aspetta vicino al cancello della foresta. Appena c’è un lupo esce dal cancello (le ante si aprono anche per lui), gira attorno alle mura senza attraversarle, colpisce il lupo con l’ascia, raccoglie la carne che lascia (anche quella dei lupi uccisi dagli arcieri o dal boscaiolo) e, quando fuori non c’è più niente, rientra e la porta direttamente al tavolo dello sportello CARNE (passando per la corsia centrale, così non cammina sopra la catasta). Porta al massimo 20 unità per viaggio: quando la schiena è piena rientra a scaricare e poi esce di nuovo. Il livello 2 “Cacciatore esperto” è più veloce a camminare e a colpire.
  - “Venditore” (100 → 200 → 400 monete): compaiono due venditori, uno per sportello (berretto giallo, camicia chiara, grembiule verde). Stanno sempre fermi dietro il loro bancone, rivolti verso i clienti, e passano loro tutta la legna o la carne che chiedono: a ogni pezzo si girano un attimo a prenderlo dal deposito alle loro spalle, poi si sporgono in avanti allungando le braccia e il pezzo parte dalle loro mani verso il cliente. Non vanno a prendere la merce: sul deposito la portano il boscaiolo, l’aiutante (legna) e il cacciatore (carne). I clienti arrivano e vengono serviti 1,6 → 2,2 → 3 volte più in fretta, quindi si vende di più.
  L’aiutante e il cacciatore portano al massimo 20 unità per viaggio (`CONFIG.lavoratori.caricoMassimo`); il boscaiolo del giocatore invece non ha limiti. I miglioramenti comprati e i soldi già messi in un cerchio restano salvati. Tutti i prezzi e i numeri sono in `src/config.js`.
- Le icone (moneta, tronco, carne, ascia, montagna, pietre, cemento, e nei cerchi anche torre, martello, arco, arco d’oro e le facce del cacciatore e del venditore) sono disegnate dal gioco e non usano emoji, così si vedono uguali su tutti i dispositivi: nelle barre in alto, nei cerchi di upgrade (anche la moneta accanto al prezzo), nella schermata di fine corsa e nei fumetti dei clienti.
- I soldi e le risorse vengono salvati nel browser con localStorage, così i progressi restano tra una sessione e l’altra.
- La corsa è realizzata con una squadra di boscaioli, un carro, porte con numeri e bonus, alberi, rocce, lupi e una sfida finale in salita. Il carro e il suo carico si vedono sempre: quando i boscaioli sono tanti e la folla si allunga all’indietro, la telecamera arretra e si alza quanto serve per inquadrare folla e carro insieme; la pila di tronchi resta bassa e larga (anche quando il carro si ingrandisce non diventa più alta), così non copre i boscaioli davanti.
- **Tutorial**, solo alla prima partita: tre passaggi guidati, ognuno con un messaggio giallo in alto (con il numero del passaggio) e una grande freccia gialla che salta sopra il punto giusto; se il punto è fuori dallo schermo, una freccia sul bordo indica da che parte andare. 1. “Fai la prima corsa!” (freccia sul cerchio CORSA), 2. “Porta la legna allo sportello!” (la freccia indica prima la catasta e, presa la legna, lo sportello LEGNA), 3. “Compra il primo miglioramento!” (freccia sul cerchio verde più economico). Ogni passaggio sparisce quando lo si completa; dopo il terzo il tutorial non compare più (resta salvato). Durante il tutorial i lupi non arrivano: cominciano dopo il terzo passaggio, con la calma iniziale. Chi aveva già fatto almeno una corsa con una versione precedente non lo vede.
- Le porte possono modificare il numero della squadra in modo positivo o negativo, ad esempio aggiungendo o sottraendo boscaioli o moltiplicando il gruppo.
- Gli alberi possono essere abbattuti per ottenere legna, mentre rocce e lupi possono far perdere unità della squadra o carico.
- Alla fine della corsa viene mostrato un riepilogo con vittoria o sconfitta e il bottino ottenuto.
- Il gioco usa Three.js per il rendering 3D e Vite per l’avvio del progetto.

### Cosa è ancora da fare

- Il nome definitivo del gioco non è stato scelto ancora.
- La struttura completa delle “basi” e dei progressi multipli non è ancora stata portata a termine: nel codice attuale si vede una segheria, ma non ancora diversi insediamenti o livelli di base da sbloccare.
- La fase di “corsa infinita” è presente in logica e meccanica, ma non ancora pienamente espansa come una struttura di mondo infinito e di avanzamento completo.
- Non esiste ancora una schermata di selezione di base o di avanzamento tra più aree di gioco.
- La parte estetica, l’equilibrio del gioco e la narrazione potrebbero essere ulteriormente sviluppate.
- Il progetto è ancora in fase di prototipo e di testing di meccaniche base.
- Per finire il livello 1 mancano ancora (in fasi, da fare più avanti): grafica più bella dei personaggi, suoni e guadagni offline. Dopo verranno le espansioni della base (zona clienti con falò, affumicatoio, canile, casa dei lavoratori, grande magazzino), descritte in `PIANO-ESPANSIONI.md` e non ancora realizzate.

## 🎮 Comandi di gioco

I controlli usati nel codice sono questi:

- Mouse o dito: premi e trascina verso sinistra o destra per spostare il personaggio o la squadra durante la corsa.
- Tastiera: frecce sinistra/destra oppure tasti A/D.
- Schermata iniziale: cliccare il pulsante “Gioca”.
- Dopo una corsa: cliccare il pulsante “Alla segheria” per tornare alla base.
- Nella segheria: il giocatore si muove con il joystick virtuale su schermo o con il mouse/touch e tastiera. Le mura lo bloccano; per uscire basta avvicinarsi a un cancello, che si apre da solo.
- Per raccogliere o vendere risorse: avvicinarsi alle zone giuste della segheria (catasta, dispensa, cerchio giallo del deposito di uno sportello, monete accanto agli sportelli). Allo sportello LEGNA si scarica solo la legna, allo sportello CARNE solo la carne.
- Per comprare un miglioramento: stare sul suo cerchio verde finché la barra dorata non è piena (servono i soldi in tasca; se finiscono, quello già pagato resta nel cerchio). Torrette, cacciatore, venditori e riparazione poi lavorano da soli, senza bisogno di comandi. Se dopo l’acquisto la telecamera va a mostrare il miglioramento, il boscaiolo resta fermo per qualche secondo finché la telecamera non torna.
- Per ricominciare da zero: aprire il gioco con `?reset` alla fine dell'indirizzo (per esempio `http://localhost:5173/?reset`). Il salvataggio viene cancellato (soldi, legna, carne, miglioramenti, tutorial) e il gioco riparte come la prima volta, tutorial compreso. Poi `?reset` sparisce da solo dall'indirizzo, così ricaricando la pagina non si cancella di nuovo tutto. Attenzione: non si può tornare indietro.
- Per rivedere il tutorial: aggiungere `?tutorial` all’indirizzo del gioco (per esempio `http://localhost:5173/?tutorial`). Riparte dal primo passaggio senza cancellare i progressi.
- Per partire per una corsa: stare sul cerchio blu “CORSA” davanti al cancello in basso a sinistra.
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
- `src/main.js`: punto di partenza del gioco e loop principale.
- `src/config.js`: tutte le impostazioni principali: velocità, numero di boscaioli, porte, ostacoli, economia e telecamera.
- `src/corsa/`: logica della corsa: squadra, carro, alberi, porte, lupi, ostacoli e sfida finale.
- `src/segheria/`: logica della base: mappa, palizzata e muri solidi (`ambiente.js`), giocatore, catasta e dispensa, sportelli di vendita (`sportello.js`), clienti, pile di soldi, cancelli (`cancello.js`), mura con i loro 3 livelli, rocce, assi di metallo e animazione (`mura.js`), cerchi dei miglioramenti (`miglioramenti.js`), aiutante (`aiutante.js`), cacciatore e il suo giro attorno alle mura (`cacciatore.js`), venditori dietro gli sportelli (`venditore.js`), tutorial della prima partita con la freccia (`tutorial.js`), torrette con l’arciere e le frecce (`torrette.js`), lupi, riparazione delle mura, telecamera che va a mostrare i miglioramenti appena comprati e gestione risorse (`segheria.js`).
- `src/motore/`: controlli, input, effetti grafici e gestione della scena.
- `src/modelli/`: modelli e classi di oggetti del mondo di gioco (tra cui `sportello.js`: pali, bancone, tettoia, insegna, rastrelliera e tavolo della carne; `torretta.js`: torre di legno con la base di pietra e i rinforzi di metallo, arco e frecce dei tre livelli; `boscaiolo.js`, che con `creaLavoratore` ricolora il boscaiolo per cacciatore, venditore e arciere).
- `src/schermate/`: interfaccia, HUD e barra della vita delle mura.
- `src/salvataggio.js`: salvataggio del progresso nel browser.
- `src/economia.js`: logica delle vendite e del denaro.
- `stile.css`: fogli di stile grafico e UI del gioco.
- `public/base/`: immagini dei livelli della base (`base-livello-1/2/3.webp`), caricate dall’interfaccia in `src/schermate/schermate.js`.
- `vite.config.js`: configurazione di Vite.
- `package.json`: script del progetto e dipendenze.

## 📝 Registro modifiche

- 2026-10-23 — aggiunta della documentazione iniziale in italiano con README e regola fondamentale in CLAUDE.md.
- 2026-10-23 — il progetto è stato inizializzato come repository Git e collegato alla repo GitHub.
- 2026-10-23 — rimozione dal tracciamento dei file `.lnk` e aggiunta della regola `*.lnk` nel `.gitignore`.
- 2026-10-23 — commit iniziale del prototipo del gioco: segheria, corsa, salvataggio, vendite e meccaniche base di movimentazione.
- 2026-10-23 — prima passata di pulizia visiva della base: palizzata continua, foresta più fitta, barra della vita, lupi con 3 colpi e carne a terra, cerchi verdi di upgrade e zaino più leggibile.
- 2026-10-23 — correzione visiva della base per il playtest: foresta più ampia intorno alla radura, palizzata più coerente lungo i lati, lupi che si avvicinano da più parti e attacco automatico con l’ascia che si attiva vicino ai nemici.
- 2026-10-23 — correzione dei problemi di gameplay segnalati: nessun testo costante “Mura distrutta!”, durata del lampeggio rosso limitata a pochi decimi di secondo, palizzata più compatta e uniforme, lupi che arrivano solo dopo i primi 60 secondi e con ondate molto lente, clienti con icone di richiesta e coda esterna alla base.
- 2026-10-23 — verifica live in browser: il gioco è in esecuzione locale e la scena della segheria è stata controllata direttamente sul rendering reale di Vite.
- 2026-10-23 — correzione del blocco all’avvio: `src/segheria/ambiente.js` usava `creaScritta` (cartelli LEGNA/CARNE degli sportelli) senza importarla, e l’errore impediva di creare la scena 3D. Aggiunto l’import; verificato in Chrome che la scena compare, che “Gioca” avvia la segheria e che il boscaiolo si muove.
- 2026-10-23 — sportelli dentro le mura e cancello rifatto: palizzata ricostruita in file dritte e senza doppioni, interrotta solo dai varchi; sportelli LEGNA e CARNE come varchi della palizzata davanti, con pali grossi, bancone sporgente, tettoia di legno e insegna centrata; punto di deposito interno (rastrelliera / tavolo con ganci) dove i pezzi arrivano uno alla volta e restano impilati; i clienti comprano un pezzo alla volta dall’esterno e pagano nella pila di monete di ogni sportello; cancello con due pali grossi e due ante che si aprono, spostato al centro della palizzata di sinistra per lasciare spazio allo sportello LEGNA. Rimossi il tavolino nascosto (`src/segheria/tavolino.js`, `src/modelli/tavolino.js`) e la pila di soldi centrale; i salvataggi vecchi passano la loro merce e i soldi agli sportelli.
- 2026-10-23 — icone sistemate: in `stile.css` aggiunti i disegni vettoriali (SVG) delle classi `hud-icon--*` (moneta, tronco, carne, ascia, montagna, pietre, cemento), prima mancanti e quindi vuote; i cerchi di upgrade usano le stesse icone, anche per la moneta del prezzo al posto dell’emoji 🪙; i fumetti dei clienti disegnano tronco e carne sulla tela (`creaScritta` con l’opzione `icona` in `src/modelli/materiali.js`) invece delle emoji 🪵 e 🍖. Tolte le vecchie regole `.icona` e `.tronco` non più usate.
- 2026-10-23 — base riorganizzata e nuove regole di gioco: disposizione a due colonne (legna a sinistra, carne a destra, corsia libera al centro) con catasta e dispensa allineate ai loro sportelli; mura solide per il boscaiolo (muri come rettangoli in `ambiente.js`) e per i lupi, che restano fuori; secondo cancello (della foresta) nella palizzata di sinistra, uguale a quello della corsa, con ante che si aprono e si chiudono e bloccano il passaggio da chiuse; nessun limite di trasporto, pile sulla schiena con il numero vero sopra; clienti continui con una fila per sportello che aspetta se il deposito è vuoto; cerchi dei miglioramenti rifatti in 3D a terra (`src/segheria/miglioramenti.js`) con icona grande, prezzo, barra circolare dorata e passaggio al livello successivo; miglioramenti con effetto vero (mura di pietra e di cemento con più vita, aiutante in `src/segheria/aiutante.js`) e salvati; tolto il vecchio sistema HTML dei cerchi (`#miglioramenti-terra`). Aggiunta in CLAUDE.md la regola di rispondere sempre in italiano con spiegazioni semplici.
- 2026-10-23 — livello 1, fase 1 (mura e lupi): nuovo file `src/segheria/mura.js` con i 3 livelli delle mura (legno; “Mura di pietra” con rocce appuntite alla base solo sul lato esterno; “Rinforzo in metallo” con assi di ferro e bulloni, al posto delle mura di cemento, prezzo 160), animazione a onda palo dopo palo e rocce/assi disegnate in un colpo solo per restare leggeri; `ambiente.js` ricorda per ogni palo il lato esterno e i pali vicini; lupi circa il 35% più frequenti (tempi in `config.js`), con lo stesso danno; tolte le icone non più usate di pietre e cemento.
- 2026-10-24 — livello 1, fase 2 (nuovi acquisti): quattro nuove catene di cerchi verdi, con prezzi che raddoppiano a ogni livello. Difesa: “Riparazione” (le mura recuperano vita da sole, con scintille verdi) e “Torretta” (torri di legno sulle mura, nuovo `src/modelli/torretta.js`, con un arciere che tira frecce visibili ai lupi vicini, nuovo `src/segheria/torrette.js`). Lavoratori: “Cacciatore” (nuovo `src/segheria/cacciatore.js`: esce dal cancello della foresta, gira attorno alle mura, combatte i lupi e porta la carne alla dispensa; il cancello si apre anche per lui) e “Venditore” (nuovo `src/segheria/venditore.js`: un venditore dietro ogni sportello, clienti serviti e in arrivo più in fretta). Ogni lavoratore ha il suo colore (`creaLavoratore` in `boscaiolo.js`): aiutante blu, cacciatore verde, venditore giallo, arciere viola. Il colpo a un lupo è ora uno solo (`colpisciLupo`) per ascia, frecce e cacciatore. Nuove icone disegnate per i cerchi (torre, martello, arco, cacciatore, venditore). L’aiutante non è cambiato.
- 2026-10-24 — ritocchi prima della fase 3: base più grande di circa il 22% (mura 22,4 × 14,7 m) con sportelli, depositi, cerchi, cancelli, torri, partenze dei lupi e foresta ridisposti; lupi fin dall’inizio (il primo dopo 6 secondi), più lenti e radi nei primi 3 minuti; il lupo colpito lampeggia di bianco e la sua barra a tacche è più grande, con lo sfondo scuro; le frecce tolgono una tacca alla volta (3 frecce per lupo) e il colpo dice quante tacche toglie (`colpisciLupo(lupo, danno)`); “Potenzia arcieri” (2 livelli, 600 e 1200) nello stesso cerchio delle torrette, con torri di pietra e poi di metallo, archi e frecce nuovi (punta che brilla); i venditori portano la merce da catasta e dispensa ai loro sportelli; i cerchi possono avere un posto diverso per ogni livello e si spostano dopo l’acquisto (`miglioramenti.js`); la telecamera va a mostrare i miglioramenti che compaiono lontano (`segui` in `ambiente.js` con zoom, regia in `segheria.js`, tempi in `CONFIG.regia`). Tolto il livello “Frecce rapide” (chi lo aveva comprato ha ora “Potenzia arcieri”, che costa uguale).
- 2026-10-24 — prima della fase 3: l’aiutante fa un giro semplice in linea dritta (catasta → deposito dello sportello LEGNA → catasta, `aiutante.js` riscritto); tutti i lavoratori portano al massimo 20 unità per viaggio (`CONFIG.lavoratori.caricoMassimo`; il cacciatore rientra quando ha la schiena piena), il boscaiolo resta senza limiti; i lupi arrivano a gruppi che crescono da 1-2 a 2-3 lupi (`grandezzaGruppo`, `arrivaGruppo` in `segheria.js`), fino a 9 lupi insieme; nuovo lupo gigante ogni 2-3 minuti (doppio, scuro, barra lunga, 10 colpi d’ascia o 20 frecce, triplo danno alle mura, lento, 30 di carne) con la scritta “Arriva il lupo gigante!” (`mostraAvviso` in `schermate.js`, `.avviso` in `stile.css`); la carne dei lupi morti resta a terra in pezzi (`lasciaCarne`). Nuovo file `PIANO-ESPANSIONI.md` con il piano delle espansioni (solo progetto, non realizzato).
- 2026-10-24 — correzioni e fase 6 (tutorial): i venditori restano fermi dietro il bancone e passano la merce ai clienti con un gesto (si girano a prenderla e si sporgono a porgerla; il pezzo parte dalle loro mani), non vanno più a prenderla; il cacciatore porta la carne direttamente allo sportello CARNE; nella corsa la telecamera arretra e si alza quando la folla è lunga, e la pila di tronchi del carro è più bassa e non cresce in altezza con il carro, così carro, carico e folla si vedono sempre (provato con 8, 150 e 300 boscaioli); “Potenzia arcieri” inquadra tutte e due le torri insieme (`zoomPerVedere`); vita dei lupi in punti (lupo normale 15: 3 colpi d’ascia, 5 / 3 / 2 frecce; gigante 60: 10 colpi d’ascia, 20 / 12 / 8 frecce) con la barra a 5 tacche; più lupi (gruppi ogni 7–11 secondi, da 1-2 fino a 3-4 lupi, fino a 12 insieme); nuovo tutorial della prima partita in 3 passaggi (`tutorial.js`, `mostraTutorial` in `schermate.js`, salvato in `tutorial`; `?tutorial` per rivederlo), con i lupi fermi finché non è finito.
- 2026-10-24 — aggiunto `?reset` nell'indirizzo per ricominciare da zero: in `src/main.js`, prima di caricare la base, cancella il salvataggio (`cancella` di `salvataggio.js`) e poi toglie `?reset` dall'indirizzo.

## ✅ Note finali

Questo README descrive il progetto così come appare nel codice attuale: sono riportate solo funzionalità già implementate, senza inventare meccaniche future come se fossero già presenti. Il gioco è ancora in fase di prototipo, ma la base giocabile, la gestione risorse e la corsa con obstacle/effects sono già concrete e testabili.
