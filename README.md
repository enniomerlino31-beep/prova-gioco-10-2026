# Prova gioco

Un piccolo gioco di corsa e gestione ambientato in una segheria di montagna, dove il giocatore gestisce boscaioli, legna, carne e vendite per sopravvivere alla foresta e alle sfide finali.

## 💡 Idea del gioco

Il gioco unisce una corsa infinita con una base di gestione: la squadra corre in foresta, attraversa porte con bonus o penalità e affronta ostacoli, lupi e una salita finale. Durante la corsa si raccolgono legna e carne, mentre nella segheria si vendono risorse, si guadagnano soldi e si costruisce il progresso del giocatore. La visione completa del progetto è quella di un gioco ispirato alla meccanica di Count Masters, con un tema di boscaioli, montagna innevata e segheria assediata.

## 🧭 Stato attuale

### Cosa funziona già oggi

- Il gioco ha un ciclo principale con tre modalità: menu, segheria e corsa.
- La schermata iniziale mostra il titolo del gioco e un pulsante per iniziare a giocare.
- La segheria è la base di gioco: il giocatore si muove con il joystick o con mouse/touch e con tastiera.
- La base è più piccola e immersa in una foresta di abeti innevati più densa, così la radura sembra davvero collocata nel bosco e non sospesa nel vuoto.
- Disposizione ordinata della base: a sinistra la colonna della LEGNA (cerchio del miglioramento “Aiutante”, catasta, deposito con la rastrelliera, sportello LEGNA), a destra la colonna della CARNE (cerchio del miglioramento delle mura, dispensa, deposito con il tavolo, sportello CARNE), al centro una corsia libera dove compare il boscaiolo. Nessun cerchio si sovrappone a un altro o agli edifici.
- La palizzata è continua e solida: il boscaiolo non la può attraversare e può uscire solo dai cancelli quando sono aperti. Nemmeno i lupi entrano: girano attorno alle mura e le attaccano da fuori. In alto c’è sempre la barra della vita delle mura; quando i lupi attaccano, la palizzata lampeggia.
- Il boscaiolo può colpire i lupi con l’ascia: l’attacco ha un feedback visibile, i lupi fanno un piccolo salto indietro e mostrano una barra a tre tacche di vita. Servono tre colpi per abbatterli.
- I lupi morti lasciano della carne a terra (fuori dalle mura); il boscaiolo esce dal cancello della foresta, la raccoglie passandoci sopra e la carne va sulla sua schiena.
- Il boscaiolo non ha limiti di trasporto: porta tutta la legna e la carne che vuole (le monete vanno direttamente in tasca, anche loro senza limiti). Sulla schiena ci sono due pile, disegnate al massimo fino a una certa altezza, con sopra il numero vero (es. “x530”). Le pile grandi si spostano in pezzi più grossi, così anche centinaia di unità passano in pochi secondi.
- I due sportelli di vendita (LEGNA a sinistra, CARNE a destra) fanno parte della palizzata davanti, in basso nello schermo: la palizzata si interrompe nel punto dello sportello e riprende subito dopo, due pali grossi chiudono il varco, il bancone lo occupa e sporge un po’ verso l’esterno, sopra c’è una tettoia di assi di legno con l’insegna al centro.
- Ogni sportello ha un punto di deposito dal lato interno, un paio di metri dentro la base: una rastrelliera di legno per i tronchi e un tavolo con i ganci per la carne, con un cerchio giallo a terra. Quando il boscaiolo ci passa, la merce di quel tipo vola dalla sua schiena al deposito e resta impilata in vista.
- I clienti arrivano di continuo dal basso, uno ogni 1–2 secondi, finché le file non sono piene. Ogni sportello ha la sua fila, che si allunga lungo le mura; il primo della fila prende la merce dal bancone un pezzo alla volta (la pila si abbassa) e paga. Se il deposito è vuoto, la fila aspetta finché il boscaiolo non porta altra merce. I soldi finiscono nella pila di monete accanto al deposito, dal lato interno, da raccogliere passandoci sopra.
- Due cancelli nella palizzata di sinistra, fatti uguali: due pali grossi e più alti delle mura, la palizzata si ferma ai pali, in mezzo due ante di legno che si aprono verso l’esterno quando il boscaiolo si avvicina (da dentro o da fuori) e si richiudono quando si allontana. Quello in alto porta nella foresta; quello in basso è il cancello della corsa: restando sul cerchio blu “CORSA” davanti al cancello parte una nuova corsa.
- I miglioramenti sono cerchi verdi piatti a terra, grandi come gli altri cerchi, con dentro un’icona grande di cosa si compra e sotto il prezzo con la moneta. Stando sopra al cerchio le monete volano dentro e il bordo si riempie come una barra circolare dorata. A pagamento finito il cerchio fa un saltello e passa al livello successivo. Ci sono due catene:
  - “Mura”: mura di pietra (80) e poi mura di cemento (180). Ogni livello dà più vita alle mura, le ripara tutte e le cambia di colore con un’onda che passa palo dopo palo.
  - “Aiutante” (120): compare un boscaiolo con il berretto blu che porta da solo la legna dalla catasta alla rastrelliera dello sportello LEGNA.
  I miglioramenti comprati e i soldi già messi in un cerchio restano salvati.
- Le icone (moneta, tronco, carne, ascia, montagna, pietre, cemento) sono disegnate dal gioco e non usano emoji, così si vedono uguali su tutti i dispositivi: nelle barre in alto, nei cerchi di upgrade (anche la moneta accanto al prezzo), nella schermata di fine corsa e nei fumetti dei clienti.
- I soldi e le risorse vengono salvati nel browser con localStorage, così i progressi restano tra una sessione e l’altra.
- La corsa è realizzata con una squadra di boscaioli, un carro, porte con numeri e bonus, alberi, rocce, lupi e una sfida finale in salita.
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
- Fuori dal cancello della foresta per ora si combattono i lupi e si raccoglie la carne che lasciano: tagliare gli alberi della foresta partendo dalla base non è ancora possibile (la legna arriva solo dalle corse).

## 🎮 Comandi di gioco

I controlli usati nel codice sono questi:

- Mouse o dito: premi e trascina verso sinistra o destra per spostare il personaggio o la squadra durante la corsa.
- Tastiera: frecce sinistra/destra oppure tasti A/D.
- Schermata iniziale: cliccare il pulsante “Gioca”.
- Dopo una corsa: cliccare il pulsante “Alla segheria” per tornare alla base.
- Nella segheria: il giocatore si muove con il joystick virtuale su schermo o con il mouse/touch e tastiera. Le mura lo bloccano; per uscire basta avvicinarsi a un cancello, che si apre da solo.
- Per raccogliere o vendere risorse: avvicinarsi alle zone giuste della segheria (catasta, dispensa, cerchio giallo del deposito di uno sportello, monete accanto agli sportelli). Allo sportello LEGNA si scarica solo la legna, allo sportello CARNE solo la carne.
- Per comprare un miglioramento: stare sul suo cerchio verde finché la barra dorata non è piena (servono i soldi in tasca; se finiscono, quello già pagato resta nel cerchio).
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

- `index.html`: struttura della pagina, HUD e schermate del gioco.
- `src/main.js`: punto di partenza del gioco e loop principale.
- `src/config.js`: tutte le impostazioni principali: velocità, numero di boscaioli, porte, ostacoli, economia e telecamera.
- `src/corsa/`: logica della corsa: squadra, carro, alberi, porte, lupi, ostacoli e sfida finale.
- `src/segheria/`: logica della base: mappa, palizzata e muri solidi (`ambiente.js`), giocatore, catasta e dispensa, sportelli di vendita (`sportello.js`), clienti, pile di soldi, cancelli (`cancello.js`), cerchi dei miglioramenti (`miglioramenti.js`), aiutante (`aiutante.js`), lupi e gestione risorse (`segheria.js`).
- `src/motore/`: controlli, input, effetti grafici e gestione della scena.
- `src/modelli/`: modelli e classi di oggetti del mondo di gioco (tra cui `sportello.js`: pali, bancone, tettoia, insegna, rastrelliera e tavolo della carne).
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

## ✅ Note finali

Questo README descrive il progetto così come appare nel codice attuale: sono riportate solo funzionalità già implementate, senza inventare meccaniche future come se fossero già presenti. Il gioco è ancora in fase di prototipo, ma la base giocabile, la gestione risorse e la corsa con obstacle/effects sono già concrete e testabili.
