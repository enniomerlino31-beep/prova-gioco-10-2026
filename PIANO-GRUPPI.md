# Piano dei gruppi di modifiche

> **Stato (aggiornato il 2026-10-27):** tutti i gruppi di modifiche sono **fatti, provati e approvati dall'utente e salvati** (ultimo commit di codice: Gruppo 5 = a7d4df2). Il 2026-10-30 l'utente ha dato un nuovo piano con i Gruppi 6-11 (vedi “Cosa resta da fare”), non ancora iniziati; dopo ci sono le espansioni di `PIANO-ESPANSIONI.md`.
> Il racconto completo dei gruppi finiti (richieste dell'utente, prove, correzioni, decisioni, numeri) è in [ARCHIVIO.md](ARCHIVIO.md): **non serve leggerlo a ogni sessione**, solo se serve capire perché una cosa è fatta in un certo modo.

Come si lavora: un gruppo alla volta; dopo ogni gruppo una verifica veloce (il gioco lo prova l'utente, niente partite di prova lunghe), aggiornare il README e dire cosa è stato fatto. Commit solo quando lo dice l'utente. Se la sessione sta per finire, fermarsi alla fine di un gruppo e dirlo.

## Gruppi finiti (in breve)

| Gruppo | Cosa | Commit |
|---|---|---|
| 1 | Economia e prezzi | 94332d1 |
| 2 | Base: monete in un solo cerchio, pavimento, cancelli, pile sulla schiena, nuove mura a pali, quattro torri | f279bf9 |
| 3 | Torrette e arcieri con due aspetti che si combinano; richieste A (pavimento), B, C (due cacciatori) e fila ECONOMIA a coppie | f0f1279, b32a24b |
| A | Cartellino delle monete, boscaiolo secondario, guadagni offline | 363bb2c |
| B | Suoni veri (CC0), musica, impostazioni, grida, colpi d'ascia sugli alberi | 1ffc4ab |
| C | Mura più resistenti che cedono e cadono, lupo gigante nuovo, cerchio verde di riparazione | 2bc4372 |
| 4 | Corsa: 10 coppie di porte, più alberi, orso gigante con scontro dinamico, scalinata fino a ×20 | 0b4c5f9 |
| 5 | Grafica della segheria (capanno, tettoia con sega, tre aspetti con le mura) | a7d4df2 |
| 6 | Avvisi con mini tutorial per le novità (`src/avvisi.js`) | 734bc33 |
| 7 | Nuova economia e rallentamenti, cantieri con teli e svelamento a onda, cantieri anche in corsa | 6c699b5 + ramo bozza-gruppo7 unito a main (2026-10-31) |


## Note già decise (dalle sessioni precedenti)

> Sono le note che servono per lavorare sul codice di oggi. Quelle superate (le istruzioni “da sapere prima di iniziare” dei gruppi ormai fatti e la descrizione dei vecchi suoni fatti dal codice) sono in [ARCHIVIO.md](ARCHIVIO.md).

- **Gruppo 2, mura (decisione dell'utente)**: le mura sono fatte **solo di pali verticali fitti** come in distanza-pali.png (quasi attaccati); i tronchi orizzontali sul lato interno sono stati provati e poi tolti su richiesta dell'utente. Il metallo sono fasce e bulloni sui pali, dentro e fuori.
- **Gruppo 2, fatto**: quattro torri, due per lato (MAPPA.torri: x ±11,2, z -4,2 e z 2,8); le due nuove costano 250 monete; gittata degli arcieri tornata a 8 / 9 / 10 metri; tolta la dispensa (la carne della corsa va sul tavolo dello sportello CARNE) e il banco del cacciatore è al suo posto, nella colonna di destra; il cacciatore esce dal cancello di destra; pavimenti a 300 monete ciascuno.
- **Gruppo 2, cerchi**: i miglioramenti sono in due file (DIFESA ed ECONOMIA, `CONFIG.file`): di ogni fila si vede solo il prossimo acquisto, nel suo posto accanto a quello che compra (`MAPPA.miglioramenti`, un posto per livello), e dopo l'acquisto il cerchio si sposta nel posto del successivo; i pavimenti compaiono dopo aver assunto aiutante, venditore e cacciatore. Per aggiungere un acquisto in una fila basta aggiungere [catena, livello] in `CONFIG.file`.
- **Gruppo 3, fatto**: ogni torre ha due aspetti che si combinano liberamente. La parte bassa segue il materiale delle mura (gruppi `materiali` in `modelli/torretta.js`) e cambia quando l'onda del miglioramento delle mura passa sotto la torre (`ondaArrivata` in `mura.js`). La parte alta, l'arco e l'armatura dell'arciere (stoffa, cuoio, metallo) seguono "Potenzia arcieri" (gruppi `arcieri`, `armatura` in `creaLavoratore`). Portata: ogni arciere solo sul suo lato (stesso segno di x della torre), da un angolo all'altro (+3 m oltre), fino a `gittata` metri dalla linea delle mura (`lupoDaColpire` in `torrette.js`).
- **A, pavimento (fatto)**: il parquet è stato tolto; resta solo il "Pavimento in pietra", con il cerchio al centro (x 0, z -3,45, scritta sotto). Per fare posto: il boscaiolo compare a z 0,2 e il cerchio del venditore è a z 2,65. Nei salvataggi vecchi il parquet diventa pietra e le monete tornano in tasca.
- **Fila ECONOMIA in due cerchi (fatto, provato e approvato)**: `CONFIG.file.economia` (aiutante, venditore, venditore svelto, venditore esperto) e `CONFIG.file.caccia` (cacciatore, secondo cacciatore, cacciatore esperto). **Vanno a coppie** (richiesta dell'utente dopo la prima prova; prima andavano ognuno per conto suo ed era sbagliato): tutti e due nascosti finché non c'è il banco del cacciatore (mura di pietra), poi "Aiutante" + "Cacciatore"; un cerchio al passo N si vede solo se anche l'altro ha comprato i passi prima di N, fino a `PASSI_INSIEME` = 2 (dopo: i potenziamenti con tutti e quattro i lavoratori, come prima). Regola in `aggiornaVisibilita` (`segheria.js`). Un cerchio nascosto mentre cambia posto ricompare già nel posto nuovo (`cambiaPosto` in `miglioramenti.js`). Il pavimento aspetta ancora aiutante, venditore e cacciatore (`LAVORATORI_BASE`). Posti: aiutante a sinistra, venditore al centro in basso, cacciatori in alto a destra, quindi non si toccano. Salvataggi vecchi (`cerchi` < 3): le monete del cerchio ECONOMIA tornano in tasca.
- **Scritte dei cerchi**: tolti i titoli DIFESA ed ECONOMIA; sopra (o sotto) il cerchio resta il nome dell'acquisto, dentro l'icona e il prezzo. Il cerchio del pavimento tiene il titolo PAVIMENTO.
- **C, cacciatori (fatto)**: due cacciatori (catena `secondoCacciatore`, 300 monete, nel cerchio dei cacciatori della fila ECONOMIA, insieme al "Venditore" dopo "Aiutante" e "Cacciatore"); il primo difende la metà sinistra ed esce dal cancello di sinistra, il secondo la destra dal cancello di destra; da solo, il primo fa tutti e due i lati dal cancello più vicino. Portano 30 unità di carne (`caricoCacciatore`); con tutte e quattro le torrette raccolgono solo la carne (`cacciatoriCombattono`). Fuori dalle mura girano da un angolo all'altro sempre nello stesso verso finché non vedono l'obiettivo: provato con lupi in 10 punti, nessuno incastrato.
- **Gruppo A, dopo la prova dell'utente (provato e approvato)**: l'utente ha approvato il Gruppo A e le decisioni prese da soli, e tiene 40 pezzi di legna. Poi: il boscaiolo secondario costa **5000 monete** ed è **l'ultimo acquisto**: il suo cerchio compare solo quando tutte le altre file di `CONFIG.file` sono finite e il pavimento è comprato (`aggiornaVisibilita`); posto spostato a x -2,2 (a -2,6 restavano solo 20 cm dal cerchio della catasta; quando compare è l'unico cerchio dei miglioramenti, quindi non tocca altri cerchi). Salvataggi: `cerchi` 4 in `salvataggio.js` restituisce le monete messe nel suo cerchio; chi l'aveva comprato lo tiene. `?tuttocomprato` (`compraTuttoPerProva`): tutto comprato tranne lui, 5000 monete in tasca, tutorial finito, poi sparisce dall'indirizzo. Provato con Chrome DevTools: si vede solo il suo cerchio, un salvataggio vecchio con 200 monete nel cerchio le riporta in tasca, console senza errori.
- **Gruppo A, fatto**:
  - A1: cartellino (sprite) con la moneta e il numero sopra la pila del cerchio delle monete, a 1,15 m di altezza (`soldi.js`); **quando il cerchio è vuoto sparisce** (scelta presa da soli). Da 10.000 in su il numero è corto ("12,5K", `formatta`).
  - A2: catena `boscaioloSecondario` nella fila `CONFIG.file.secondario`, un terzo cerchio ECONOMIA (prima costava 500 monete e compariva con i potenziamenti, a x -2,6: poi cambiato, vedi la nota qui sopra). `src/segheria/secondario.js`: berretto viola, slitta con la corda, tronchi visibili solo al ritorno; strada `MAPPA.giroSecondario` (catasta → cancello della corsa → lungo le mura a sinistra della segheria → tra gli abeti). Tutto dipende da `mancano` (secondi al ritorno alla catasta): il giro dura esattamente `minutiSecondario`, il ritorno a piedi è dentro il conto. Conto alla rovescia accanto al cancello della corsa (x +3,6, alto 2,4 m): sopra il cancello toccava la barra delle mura. Durante le corse `lavoraDuranteLaCorsa` (chiamato da `main.js`).
  - A3: `src/segheria/offline.js` (`secondiDiAssenza`, `ritmi`, `lavoroOffline`) chiamato da `lavoroMentreVia` in `segheria.js` appena caricato il salvataggio; i risultati stanno in `stato.bentornato` finché non si preme "Raccogli" (`apriBentornato`, `versaMonete`). Decisioni prese da soli: le vendite offline richiedono un venditore (senza, la merce resta dov'è); la carne si vende solo se è già sul tavolo, **i cacciatori offline non portano carne nuova** (servirebbe simulare i lupi: non è semplice); `stato.orologio` non torna mai indietro (al massimo 24 ore avanti) e viene salvato subito dopo il calcolo, così ricaricare non dà monete due volte; sul telefono, tornando nella base dopo 2 minuti con la pagina aperta, la pagina si ricarica per calcolare i guadagni. Numeri: con il boscaiolo secondario circa 975 monete all'ora; senza, 0 all'ora (si vende solo la merce già presente). Provato con `?offline=60`: 12 giri = 480 legna, 1.278 monete (con 100 legna e 20 carne già presenti), ricaricando la pagina non raddoppia, durante il tutorial non compare.
- **Gruppo 5, segheria (fatto, approvato)**: l'edificio è in `src/modelli/segheria.js` (posizione `MAPPA.casa`, fuori dal cancello della corsa), con l'onda delle mura (`ondaArrivata` in `mura.js`, come le torri) e il legno `legnoPali` di `materiali.js`. Vedi "GRUPPO 5: COSA È STATO FATTO".

## Cosa resta da fare

Piano dato dall'utente il 2026-10-30 (testo originale). Si lavora un gruppo alla volta, nell'ordine 6 → 11.
**Stato (aggiornato il 2026-10-31): il Gruppo 6 è FATTO, approvato e salvato (734bc33). Il Gruppo 7 è FATTO, provato e approvato dall'utente, unito a `main` (commit finale a15cb86, avanzamento semplice, cronologia non riscritta) e inviato su GitHub; il ramo `bozza-gruppo7` è chiuso (resta su GitHub, identico a `main`). Restano da fare: la proposta di durata dei lavori (sotto, NON applicata, aspetta l'ok dell'utente) e il Gruppo 8 (non iniziato: si comincia in una nuova sessione).**
Gruppo 6, com'è fatto: vedi README, “Avvisi delle novità”. Il sistema è in `src/avvisi.js`: per aggiungere un avviso (anche nei Gruppi 8-11: giornata, personale, nuove zone, affumicatoio, clienti...) basta un testo in `AVVISI` e una riga in `controllaAvvisi` (`segheria.js` per la base, `corsa.js` per la corsa).

### Come riprendere (aggiornato il 2026-10-31)

1. Si lavora su `main` (il Gruppo 7 è unito, commit a15cb86; il ramo `bozza-gruppo7` è chiuso). Per ogni gruppo nuovo conviene un ramo di bozza nuovo (`git checkout -b bozza-gruppo8`) e l'unione a `main` solo dopo il via dell'utente.
2. Riaccendere il server di prova: `npm run dev` e aprire `http://localhost:5173/?reset&ricco&cantieri=1` (sul telefono: l'indirizzo di rete che stampa Vite). Per una partita pulita senza toccare il salvataggio della 5173: un secondo server su un'altra porta (`npx vite --host --port 5174`) con `?reset&senzatutorial`: il salvataggio del browser è separato per porta.
3. Prima cosa da decidere con l'utente: la proposta di durata dei lavori (tabella più sotto, NON applicata). Poi iniziare il Gruppo 8 (giornata e personale).

### Gruppo 7: com'è fatto (provato e approvato il 2026-10-31) e tabella prima / dopo

Versione definitiva della richiesta (2026-10-30, dopo la prima prova): **catasta senza limite** (niente avviso “catasta piena”, nessuno aspetta mai), **boscaiolo secondario in circa 15-20 minuti**, **lavoratori senza cantiere** (arrivano a piedi da un cancello dopo 2-3 secondi), **cantieri solo per le costruzioni e sulla cosa migliorata** (la costruzione funziona al livello vecchio finché non finiscono), **animazione della legna**. Dettagli nel README (sezioni Economia, Catasta, Cantieri, Lavoratori, Animazione).

| Cosa | Prima | Dopo |
|---|---|---|
| Limite della catasta | nessuno | nessuno (disegno fermo a 36 pezzi; icona che lampeggia con meno di 10 pezzi) |
| Clienti: arrivo | ogni 1,2-2,2 s (media 1,7) | ogni 2,2-3,2 s (media 2,7) |
| Clienti: carico di ogni acquisto | 5-15 unità (media 10) | 5-13 unità (media 9) |
| Durata di un acquisto | 0,7 s + 0,3 s a pezzo | 1,0 s + 0,4 s a pezzo |
| Prezzo legna / carne (per unità) | 2 / 5 | 2 / 5 (uguale) |
| Legna per albero (corsa) | 12 | 10 |
| Aiutante: carico e velocità | 20 unità, 3 m/s | 15 unità, 2,4 m/s |
| Boscaiolo secondario | 40 legna ogni 5 min (circa 960 monete/ora) | 15 legna ogni 3 min (circa 600 monete/ora) |
| Venditore della legna | si compra (100) insieme a quello della carne | **gratis**, primo cerchio dopo il tutorial; arriva a piedi |
| Venditore della carne / svelto / esperto | 100 / 200 / 400 (×1,6 / ×2,2 / ×3) | 250 / 450 / 900 (×1 / ×2 / ×3); arrivo a piedi, niente cantiere |
| Mura di pietra / metallo | 250 / 600 | 250 / 450; cantiere sulle mura 6 / 45 s |
| Torrette 1-6 | 150, 150, 250, 250, 600, 1200 | 250, 250, 400, 400, 800, 1500; cantiere sulla torretta 8, 10, 15, 20, 35, 50 s |
| Riparazione 1-3 | 100, 200, 400 | 250, 350, 700; **nessun cantiere** (vale subito, con un piccolo effetto di ripristino; tolto il 2026-10-30) |
| Aiutante | 120 | 250; arriva a piedi (niente cantiere) |
| Cacciatore / secondo / esperto | 200 / 300 / 400 | 250 / 300 / 500; a piedi, niente cantiere |
| Pavimento in pietra | 300 | 250; **nessun cantiere** (compare subito dopo i 1,5 s di pagamento, onda di lastre di 1,4 s; tolto il 2026-10-31) |
| Boscaiolo secondario | 5000 | 5000 (sempre l'ultimo); arriva a piedi |
| Pagamento | 12 voli di monete in 1,5 s | prima a goccia (da 2 a 15 s), poi **di nuovo 12 voli in 1,5 s per tutti** (lavoratori e costruzioni), 2026-10-30 |
| Cantieri | nessuno (subito) | solo per le costruzioni, sulla cosa migliorata, da 6 a 50 s (durata indipendente dal pagamento); mura e torrette **avvolte da teli** costruiti a fasi legate alla barra (puntelli 20%, travi 20%, assi 20%, teli 40%), operai che salgono, camminano, portano assi e martellano, svelamento sotto i 3 s, suoni dei lavori e sega (rifatto il 2026-10-30; prima erano impalcature intorno) |
| Tempo per arrivare al boscaiolo secondario | pochi minuti | circa 17-18 minuti (modello di calcolo; primo acquisto a pagamento dopo circa 40 s di vendite, circa 1 minuto giocando) |

### STATO A FINE SESSIONE DEL 2026-10-31 (salvataggio di sicurezza sul ramo `bozza-gruppo7`, non su `main`)

**Fatto e provato con Chrome (telefono, processore 4 volte più lento, 57-60 fotogrammi al secondo, console senza errori, `npm run build` ok):**
1. Avvisi: nuovi “L'aiutante” e “Il pavimento in pietra”; “Il venditore della carne” (testo nuovo) ora parte quando il venditore è arrivato (prima partiva quando compariva il suo cerchio, cioè subito dopo l'aiutante: era la causa dell'avviso sbagliato). “Lavori in corso!” nomina solo mura nuove e torrette. Provati acquisti veri: ognuno una volta sola, nell'ordine giusto.
2. Teli su tutto il cantiere: pali dei 3 cancelli e dei 2 sportelli avvolti, telo corto sopra ogni cancello, passaggio libero (provato camminando dal cancello laterale).
4. Pavimento senza cantiere: vale subito, onda di lastre di 1,4 s; vecchi salvataggi con cantiere del pavimento in corso lo trovano già fatto (provato).

**Fatto dopo, nella stessa giornata (2026-10-31, sessione successiva; provate e approvate dall'utente, committate e unite a `main`):**
- 5. Cantieri che finiscono durante la corsa: `lavoraDuranteLaCorsa` → `finisceInCorsa` (miglioramento effettivo subito e in silenzio: `completaMiglioramento(.., { silenzioso: true })`, `tappeDelMiglioramento(.., animato)`), `finitiInCorsa`, `riprendiCantieri` (chiamato da `entra`: un solo giro di telecamera, una tappa per cantiere, `svela` + `svelamenti`), `Cantiere.riallinea()` (fasi già raggiunte subito, operai già sul piano).
- 3. Svelamento a onda continua: in `cantiere.js`, teli = `BoxGeometry(1,1,1,12,1,1)` per cantiere con attributo istanziato `aSvela` (secondi di svelamento, ritardo del primo, durata dell'onda), `GLSL_ARROTOLA` nel vertex shader del telo e del suo `customDepthMaterial` (ombra); `SVELAMENTO.onda` 1,6, `telo` 0,55; tolto dalla CPU il calcolo `roll`/`onda`/`presente` dei teli; `svela()` mette prima tutto al suo posto con `aggiornaIstanze(true)`. Durata misurata 2,58 s.
- Provato con Chrome (telefono, CPU x4): 59-60 fps, console pulita, mura e torrette finite in corsa (effettive subito, salvate, svelate al ritorno), cantiere ripreso a metà senza scatti, immagini dell'onda controllate a mano (il bordo del telo sale inclinato, la parete in fondo si scopre prima di quella davanti).
- **Correzione dello svelamento (2026-10-31, provata e approvata)**: i teli restavano visibili in alto per circa 1 secondo dopo l'onda perché la scatola del telo, a fine salita, lasciava il suo "coperchio" piatto (facce alta e bassa) largo come prima fino alla distruzione del cantiere a 2,58 s. Ora `GLSL_ARROTOLA` toglie lo spessore del telo (e della sua ombra) negli ultimi 10% della salita di ogni punto, quindi sparisce quando l'onda lo scopre. Niente altro è cambiato. Misura (telefono, CPU x4, tende dipinte di magenta): pixel di tenda a 2,5 s prima 53.627, dopo 0; dopo la fine 0 pixel e 0 oggetti del cantiere nella scena in tutti i casi (mura, torrette, due cantieri insieme, finito in corsa, ripreso da salvataggio, uscita e rientro nella pagina). Nota: il gioco oggi ha un solo cantiere alla volta (c'è una sola fila che li produce, DIFESA); i "due insieme" sono stati provati con un salvataggio costruito a mano.
- Decisioni prese da sole: vedi il messaggio di fine sessione (le nuvolette e le scintille ai piedi dei teli restano come prima, il telaio si rimpicciolisce per blocchi appena dietro il fronte, gli operai già saliti compaiono sul piano al ritorno, i cantieri finiti in corsa non ripartono se si chiude la pagina durante la corsa: il miglioramento è già salvato).

**Da non dimenticare / segnalato all'utente:** chi ha già pavimento, aiutante o venditore della carne vedrà una volta sola il loro avviso al primo avvio (decisione presa da solo); gli sportelli hanno il telo solo sui pali (decisione presa da solo, per non nascondere il venditore); il telo corto sopra i cancelli può nascondere per un attimo la testa di chi passa subito dietro (accettato).

**Cosa resta da fare, in ordine:**
1. L'utente prova il ramo (teli, pavimento, avvisi).
2. ~~Scrivere la richiesta 5 (vedi progetto sotto), poi la 3~~: **fatto** (vedi sopra); l'utente le prova: fine lavori nella base, fine lavori durante una corsa (per provare: `?reset&ricco&cantieri=3`, cioè lavori 3 volte più lunghi: le mura di pietra durano 18 s; comprarle e partire subito per la corsa, restare in corsa almeno 20 s e tornare alla base), più cantieri insieme.
3. ~~Dopo l'ok dell'utente: unire a `main`, `git push`~~: **fatto il 2026-10-31**.
4. Decidere la proposta di durata dei lavori (tabella più sotto) e iniziare il Gruppo 8.

**Progetto della richiesta 5 (approvato: “svelamento mostrato al ritorno”):**
- I lavori avanzano già durante la corsa alla stessa velocità (solo tempo: `passa` chiamato da `lavoraDuranteLaCorsa` in `segheria.js`); si fermano solo con un avviso aperto o con il menu impostazioni.
- In `lavoraDuranteLaCorsa`: se `cantiere.finito` e senza `fase`, chiamare un nuovo `finisceInCorsa(voce)`: toglie la voce da `this.cantieri`, mette il cantiere in una nuova lista `this.finitiInCorsa`, `cerchi[..].finisciCantiere()` e `completaMiglioramento(cerchio, { silenzioso: true })` (nuovo parametro: niente testi, suoni, telecamera, sbuffi; tutte le azioni subito e senza animazione, quindi `tappeDelMiglioramento(nome, livello, animato)` con `applicaLivello(.., animato)`, `mostraTorre(i, animato)`, `aggiornaAspetto(i, animato)`, `banco.mostra(animato)`; poi `salvaOra()`).
- In `entra()` (dopo `chiudiRegia()`): per ogni cantiere ancora in corso chiamare un nuovo `riallinea()` in `cantiere.js` (le parti già raggiunte dalla barra compaiono subito con `parti[nome] = -100`, scala e pila uguale, `comparsa = 1`, cartelli a grandezza piena, `aggiornaIstanze(true)`): oggi, al ritorno, tutte le fasi “scattano” insieme perché `tempo` non avanza in corsa. Per ogni cantiere in `finitiInCorsa`: `riallinea()` e poi un solo giro di telecamera (`this.regia`) con una tappa per cantiere (sosta = `DURATA_SVELAMENTO_MASSIMA + 0.2`) la cui azione fa `cantiere.svela()` e lo mette in `this.svelamenti` (poi `aggiornaCantieri` lo toglie quando `svelato`). Il miglioramento è già effettivo, non c'è onda dei pali nuovi (restano sotto i teli).
- Suoni dei lavori e telecamera non cambiano (`ascoltoLavori`: solo se visibile o a meno di 7 metri; la telecamera parte da `reimpostaTelecamera` + `segui(giocatore, 0)` e poi viaggia piano: niente salti).
- Provare: cantiere che finisce durante una corsa (salvataggio con `rimasto` di pochi secondi e `?corsa`), più cantieri insieme (mura + torrette), salvataggio ripreso a metà, cantiere che finisce nella base come prima.

**Progetto della richiesta 3 (approvato: “onda continua”), tutto in `cantiere.js`:**
- Il telo è una scatola con 12 segmenti in lunghezza (`new THREE.BoxGeometry(1,1,1,12,1,1)`, una per cantiere, da liberare in `geometrie`) con un attributo per telo `aSvela` (vec3: secondi dall'inizio dello svelamento o -1, ritardo del primo telo, durata dell'onda; 0 per le torrette). Nel vertex shader del materiale `telo` (e in un `customDepthMaterial` `MeshDepthMaterial` con `RGBADepthPacking`, così anche l'ombra segue) per ogni vertice col y < 0: ritardo = |angolo(x,z) − angolo dell'origine `MAPPA.miglioramenti.mura`| / π (come `ritardo` in `copriMura`), `k = clamp((tempo − 0,35 − (ritardo − primo)·onda) / 0,55)`, `e = k²(1,9k − 0,9)` (piccolo “respiro” verso il basso e poi sale veloce), `y' = mix(y, 0.5, e)` più un'ondina in z; `ritardo = max(ritardo, primo)` così il primo telo parte esattamente a 0,35 s (quando il miglioramento diventa effettivo).
- `SVELAMENTO.onda` da 1,8 a 1,6 e `telo` 0,55: l'ultimo blocco finisce a circa 2,6 s (< 3 s). Il telaio (puntelli, travi, assi) resta come oggi, per blocchi, appena dietro il fronte. Togliere dal codice CPU `roll`/`onda`/`presente` del telo in `aggiornaIstanze`; aggiornare `aSvela` in `aggiornaSvelamento`.
- Provare: nessuno scuotimento, lampo o fontane; fotogrammi in fine lavori con CPU 4x; telo corto sopra i cancelli e torrette (onda 0: salgono tutte insieme).

### Proposte del 2026-10-31: le due qui sotto sono **APPROVATE dall'utente e ora scritte nel codice** (provate e approvate; progetto sopra)

- **Svelamento più fluido (richiesta 3)**: oggi ogni telo (blocchi di circa 3 m) si arrotola per conto suo quando l'onda delle mura nuove lo raggiunge, quindi il movimento va "a blocchi". L'onda originaria delle mura (`mura.js`) parte dal cerchio di acquisto e fa il giro della base in 1,8 s: ogni palo ha un ritardo secondo la distanza angolare dal cerchio, quando l'onda arriva il pezzo nuovo spunta con un rimbalzo (easeOutBack, 0,4 s) e il palo fa un saltello di +25%. Proposta: stessa onda (stessa origine, stessa durata, stesso ritardo), ma calcolata dalla scheda grafica per ogni punto del telo, così il bordo basso del telo sale lungo una linea continua che segue il fronte dell'onda; il telo sale con un piccolo sorpasso verso l'alto e poi si ferma, il telaio si rimpicciolisce appena dietro il fronte, il palo vero fa il suo saltello subito dopo. Totale circa 2,6 s, nessuno scuotimento, lampo o fontana; il miglioramento resta effettivo quando parte il primo telo.
- **Cantieri durante la corsa (richiesta 5)**: i lavori avanzano già alla stessa velocità durante la corsa (dipendono solo dal tempo, `passa` in `cantiere.js`, chiamato da `lavoraDuranteLaCorsa`; si fermano solo con un avviso aperto o con il menu delle impostazioni, come tutto il gioco). Quello che non va è il ritorno: i pezzi "scattano" tutti insieme e poi parte subito lo svelamento. Proposta: se il tempo finisce durante la corsa il miglioramento diventa effettivo subito (dati e disegno, senza animazione); al ritorno compare il cantiere già finito (senza rifare la costruzione), la telecamera ci va e lo svelamento parte una volta sola; con più cantieri finiti insieme, un solo giro di telecamera con una tappa per ognuno.

### Proposta durata dei cantieri (2026-10-30, **NON applicata**: aspetta l'ok dell'utente)

Oggi (a velocità normale, senza `?cantieri`): mura di pietra 6 s, rinforzo in metallo 45 s; (la riparazione e il pavimento non hanno più il cantiere); torrette 8 / 10 / 15 / 20 / 35 / 50 s. Con 4 fasi (20-20-20-40%) i lavori sotto i 15 secondi passano troppo in fretta: ogni fase dura meno di 3 secondi.

| Cosa | Oggi | Proposta |
|---|---|---|
| Mura di pietra | 6 s | **20 s** |
| Rinforzo in metallo | 45 s | **30 s** (più lungo del precedente ma non esagerato) |
| Torretta sinistra 1 / destra 1 | 8 / 10 s | **15 / 15 s** |
| Torretta sinistra 2 / destra 2 | 15 / 20 s | **18 / 20 s** |
| Potenzia arcieri 1 / 2 | 35 / 50 s | **30 / 40 s** |

Equilibrio: la durata dei lavori non blocca i guadagni (le monete si accumulano mentre si aspetta), ma ritarda l'effetto di quello che si compra. **Senza più la riga del pavimento (30 s), la somma dei tempi scende di 30 secondi** (189 s oggi, 188 s con la proposta; con il pavimento erano 219 e 218): tra oggi e proposta cambia solo come sono distribuiti, più lunghi all'inizio (mura +14 s, torrette +7 e +5 s) e più corti verso la fine (rinforzo -15 s, potenzia arcieri -5 e -10 s). Il punto più sensibile è il primo: le mura di pietra portano i lupi e il banco del cacciatore (da cui compaiono aiutante e cacciatore), quindi 20 s invece di 6 spostano la catena di circa 14 s; ma la fine è più veloce, quindi il boscaiolo secondario resta intorno ai 16-17 minuti, dentro l'obiettivo 15-20. Il primo acquisto a pagamento (dopo circa 1 minuto) non cambia. Stima fatta a mano, non con il modello di calcolo.

```
GRUPPO 6 - Avvisi e mini tutorial
GRUPPO 7 - Nuova economia (versione definitiva del 2026-10-30): catasta SENZA
limite (contatore con il numero, il disegno smette di crescere, icona che
lampeggia con meno di 10 pezzi); animazione della legna (si china, pila che
oscilla, tronchi lanciati uno alla volta con arco e rimbalzo); primo cerchio
in assoluto = venditore della legna GRATUITO (la legna non si vende più da
sola); venditore della carne dopo l'aiutante e a pagamento; vendite più
lente e prezzi più alti (boscaiolo secondario in 15-20 minuti, primo
acquisto dopo 1 minuto); monete a goccia; lavoratori senza cantiere (arrivano
a piedi da un cancello dopo 2-3 secondi); costruzioni (mura e torrette; dal
2026-10-31 il pavimento e la riparazione NON hanno cantiere): cantiere SULLA COSA MIGLIORATA, che lavora al livello vecchio
finché non finisce (6-50 secondi); corsa del boscaiolo secondario da 5 a 3
minuti con meno legna; avvisi (venditore della legna, legna in esaurimento,
primo cantiere, venditore della carne)
GRUPPO 8 - Giornata e personale: giornata di 4-5 minuti, poi schermo nero
di 1-2 secondi con "Giorno N"; paga automatica a fine giornata (chi non
viene pagato per mancanza di monete non torna e va riassunto); menu del
personale con elenco lavoratori, paga, costo totale al giorno, pulsanti
Assumi/Licenzia (i cerchi sbloccano il tipo di lavoratore, il menu poi lo
gestisce); stanchezza (si siedono con "Zzz", si svegliano toccandoli);
guadagno offline semplice, senza paga e stanchezza
GRUPPO 9 - Zona lavorazione legna (cerchio "Espandi" circa 2.500, dentro
le mura): segheria (tronchi -> assi, segantino) e falegnameria (assi ->
fasci di legna, sedie, slitte, falegname); le assi servono anche come
costo di mura e miglioramenti grandi. Prima di costruire, fai uno
screenshot della mappa e proponimi dove mettere le zone dei Gruppi 9-11
GRUPPO 10 - Affumicatoio (cerchio "Espandi" circa 6.000, vicino ai
cacciatori): carne -> carne affumicata, poi salsicce; brucia legna come
combustibile; lavoratore affumicatore
GRUPPO 11 - Zona clienti (Espansione 1, cerchio "Espandi" 10.000, fuori
dalle mura, i lupi non ci arrivano): i clienti comprano i prodotti (slitte,
sedie, carne affumicata) e lasciano la mancia; miglioramenti: panche,
tavoli, falò più grande con più posti. Aggiorna anche PIANO-ESPANSIONI.md
Ogni zona e ogni miglioramento al suo interno si paga. Prezzi indicativi:
regolali tu in base all'economia rallentata.
```

Note per chi lavora sul piano:
- Il Gruppo 6 nel piano è solo un titolo: prima di iniziarlo va chiesto all'utente quali avvisi e quali mini tutorial vuole (il Gruppo 7 ha aggiunto “legna in esaurimento” e gli altri avvisi della nuova economia, quindi non vanno fatti due volte).
- Il Gruppo 9 deve cominciare con uno screenshot della mappa e una proposta all'utente su dove mettere le zone dei Gruppi 9-11, **prima** di costruire.
- Il Gruppo 11 deve aggiornare anche `PIANO-ESPANSIONI.md`.
- Le espansioni già descritte in `PIANO-ESPANSIONI.md` (zona clienti con falò, affumicatoio, canile, casa dei lavoratori, grande magazzino) restano da fare dopo questi gruppi, una alla volta, solo quando lo dice l’utente.
