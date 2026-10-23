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
- La palizzata di legno è continua e visibile, con pali appuntiti, sfumature più realistiche e una barra della vita sempre presente in alto. Quando i lupi attaccano, la muraglia lampeggia e mostra chiaramente il danno.
- Il boscaiolo può colpire i lupi con l’ascia: l’attacco ha un feedback visibile, i lupi fanno un piccolo salto indietro e mostrano una barra a tre tacche di vita. Servono tre colpi per abbatterli.
- I lupi morti lasciano della carne a terra; il boscaiolo la raccoglie passandoci sopra e la carne entra nella pila sulla schiena, assieme a legna e monete.
- I due sportelli di vendita sono visibili in basso nello schermo e la merce si accumula sui banchi; i clienti continuano a comprare la merce dal tavolo e i soldi si accumulano a terra da raccogliere.
- Il giocatore trae risorse dalle cataste, le porta al tavolo e incassa i soldi già gestiti dal sistema di clienti e pile di monete.
- I miglioramenti della base sono mostrati come cerchi verdi disegnati a terra, con prezzo e icona; il boscaiolo può fermarsi sopra al cerchio e attivare il progresso dell’acquisto.
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
- Le icone senza emoji sono a metà: l’HTML e i cerchi di upgrade usano le classi `hud-icon--*` e `upgrade-ring__icon--*`, ma in `stile.css` mancano ancora le regole per disegnarle, quindi per ora compaiono vuote. Nel prezzo dei cerchi è rimasta l’emoji 🪙.

## 🎮 Comandi di gioco

I controlli usati nel codice sono questi:

- Mouse o dito: premi e trascina verso sinistra o destra per spostare il personaggio o la squadra durante la corsa.
- Tastiera: frecce sinistra/destra oppure tasti A/D.
- Schermata iniziale: cliccare il pulsante “Gioca”.
- Dopo una corsa: cliccare il pulsante “Alla segheria” per tornare alla base.
- Nella segheria: il giocatore si muove con il joystick virtuale su schermo o con il mouse/touch e tastiera.
- Per raccogliere o vendere risorse: avvicinarsi alle zone giuste della segheria (catasta, dispensa, tavolino, soldi a terra, cancello, sportelli di vendita e cerchi di miglioramento).
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
- `src/segheria/`: logica della base: ambiente, giocatore, costruzioni, clienti, tavolo, soldi, palizzata, lupi e gestione risorse.
- `src/motore/`: controlli, input, effetti grafici e gestione della scena.
- `src/modelli/`: modelli e classi di oggetti del mondo di gioco.
- `src/schermate/`: interfaccia, HUD, barra della vita delle mura e cerchi di upgrade sul terreno.
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

## ✅ Note finali

Questo README descrive il progetto così come appare nel codice attuale: sono riportate solo funzionalità già implementate, senza inventare meccaniche future come se fossero già presenti. Il gioco è ancora in fase di prototipo, ma la base giocabile, la gestione risorse e la corsa con obstacle/effects sono già concrete e testabili.
