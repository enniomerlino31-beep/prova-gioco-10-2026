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
**Stato: il Gruppo 6 è fatto, approvato e salvato (734bc33). Il Gruppo 7 è fatto e aspetta la prova dell'utente (non ancora committato); i Gruppi 8-11 non sono iniziati.**
Gruppo 6, com'è fatto: vedi README, “Avvisi delle novità”. Il sistema è in `src/avvisi.js`: per aggiungere un avviso (anche nei Gruppi 8-11: giornata, personale, nuove zone, affumicatoio, clienti...) basta un testo in `AVVISI` e una riga in `controllaAvvisi` (`segheria.js` per la base, `corsa.js` per la corsa).

### Gruppo 7: com'è fatto (da provare) e tabella prima / dopo

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
| Riparazione 1-3 | 100, 200, 400 | 250, 350, 700; cantiere sulle mura 10, 20, 30 s |
| Aiutante | 120 | 250; arriva a piedi (niente cantiere) |
| Cacciatore / secondo / esperto | 200 / 300 / 400 | 250 / 300 / 500; a piedi, niente cantiere |
| Pavimento in pietra | 300 | 250; cantiere 30 s |
| Boscaiolo secondario | 5000 | 5000 (sempre l'ultimo); arriva a piedi |
| Pagamento | 12 voli di monete in 1,5 s | a goccia: un pacchetto di monete ogni 0,25 s (8-60 gocce: da 2 a 15 secondi) |
| Cantieri | nessuno (subito) | solo per le costruzioni, sulla cosa migliorata, da 6 a 50 s |
| Tempo per arrivare al boscaiolo secondario | pochi minuti | circa 17-18 minuti (modello di calcolo; primo acquisto a pagamento dopo circa 40 s di vendite, circa 1 minuto giocando) |

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
a piedi da un cancello dopo 2-3 secondi); costruzioni (mura, torrette,
pavimento): cantiere SULLA COSA MIGLIORATA, che lavora al livello vecchio
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
