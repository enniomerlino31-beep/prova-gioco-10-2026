# Piano dei gruppi di modifiche (prima delle Fasi 4 e 5)

> **Stato:** il Gruppo 1 (economia e prezzi) e le correzioni successive sono fatti e salvati.
> Il Gruppo 2 è **fatto** (2026-10-25), con le correzioni chieste dopo la prima prova (mura solo a pali, quattro torrette,
> arcieri che tirano da un lato all'altro, soldi sempre monete, impronte cartoon, cerchi in due file DIFESA ed ECONOMIA,
> monete che mancano nei cerchi): in attesa della prova dell'utente prima del commit.
> I Gruppi 3 e 4 qui sotto sono **ancora da fare**, uno alla volta, nell'ordine.

Come si lavora: un gruppo alla volta; dopo ogni gruppo una verifica veloce (il gioco lo prova l'utente, niente partite di prova lunghe), aggiornare il README e dire cosa è stato fatto. Commit solo quando lo dice l'utente. Se la sessione sta per finire, fermarsi alla fine di un gruppo e dirlo.

Qui sotto c'è il testo dei gruppi così come l'ha scritto l'utente.

---

## GRUPPO 2: BASE

8. Monete in un solo punto: le monete pagate dai clienti si accumulano in UN SOLO cerchio centrale, tra i due sportelli di vendita (dal lato interno). Togli le pile di monete separate.

9. Pavimento:
   - togli il cerchio bianco/scuro che c'è a terra dentro la base
   - il pavimento della base diventa di neve, come fuori
   - aggiungi due cerchi di acquisto: "Pavimento in pietra" e "Parquet". Il giocatore ne compra uno solo: quando ne compra uno, l'altro cerchio sparisce. Il pavimento cambia con un'animazione che si espande dal punto di acquisto.

10. Cancelli:
   - il cancello della CORSA va spostato sul lato SUPERIORE dello schermo, al centro, in corrispondenza della segheria. Il cerchio CORSA va davanti a lui, dentro la base.
   - il cancello di SINISTRA (foresta) va centrato sul lato sinistro delle mura.
   - aggiungi un nuovo cancello sul lato DESTRO, al centro, fatto uguale agli altri, che si apre quando il boscaiolo si avvicina.
   Ridisponi gli elementi della base se serve, senza sovrapposizioni.

11. Pile sulla schiena del boscaiolo: devono stare CENTRATE sulla schiena e una DIETRO l'altra (in fila verso il retro), non una accanto all'altra. Ordine dalla schiena verso fuori: legna, carne, monete.

12. Nuova struttura delle mura (cambia solo la grafica, non la logica):
   Nella cartella public/riferimenti/ ho messo tre foto di riferimento: aprile e guardale tutte.
   - muro-riferimento.png: la STRUTTURA delle mura (tronchi orizzontali tra pali verticali).
   - distanza-pali.png: la DISTANZA tra i pali verticali. Rispetta questa spaziatura.
   - legno-riferimento.png: l'ASPETTO del legno (colore, venature, anelli alle estremità dei tronchi). Ispirati a questa per tronchi e pali.
   Se le foto danno indicazioni diverse tra loro, per la struttura segui muro-riferimento, per la spaziatura distanza-pali e per il legno legno-riferimento.

   Come devono diventare le mura:
   - tronchi ROTONDI messi in ORIZZONTALE, uno sopra l'altro (circa 5-6 tronchi impilati), tenuti fermi da pali VERTICALI più grossi piantati a intervalli regolari
   - i tronchi orizzontali hanno le estremità tonde ben visibili, con gli anelli del legno, e venature lungo il tronco
   - gli SPUNTONI restano: i pali verticali sporgono sopra i tronchi orizzontali e finiscono a punta, con un po' di neve sopra
   - restano tutti i livelli di miglioramento, adattati alla nuova forma:
     - Mura di pietra: le rocce appuntite alla base, solo sul lato esterno, come ora
     - Rinforzo in metallo: fasce e staffe di ferro scuro con bulloni che stringono i tronchi orizzontali ai pali verticali
   - cancelli e sportelli si inseriscono nelle mura come ora, con i pali verticali grossi ai lati
   - tutto deve restare leggero: disegna tronchi e pali in un colpo solo come ora, così il gioco non rallenta sul telefono
   Non cambiare vita, prezzi e animazioni delle mura (a parte quanto chiesto nel Gruppo 1): cambia solo l'aspetto.

## GRUPPO 3: TORRETTE E ARCIERI

13. Tre tipi di torretta, in base al materiale delle mura:
   - mura di legno: torretta di legno, con lo stesso stile delle nuove mura
   - mura di pietra: torretta con base in pietra
   - mura con rinforzo in metallo: torretta rinforzata in metallo
   Quando si migliorano le mura, anche le torrette già costruite (fino a quattro: due per lato) cambiano aspetto con la stessa animazione.

14. Con ogni potenziamento degli arcieri cambiano anche: l'arco (più grande e decorato), l'armatura dell'arciere (da vestiti di stoffa, a cuoio, a metallo) e l'aspetto della torretta, per tutte e quattro le torri. La telecamera deve inquadrare tutte le torri costruite insieme (fino a quattro), come ora.

   (Aggiornato dopo il Gruppo 2: le torrette ora sono **quattro**, due per lato: sinistra 1 e destra 1 sopra i cancelli dei lati, sinistra 2 e destra 2 subito sotto. Si comprano dalla fila DIFESA, vedi `CONFIG.file`.)

14 bis. Portata degli arcieri (chiesto dopo il Gruppo 2):
   - Gli arcieri NON devono coprire tutta la base. Ogni arciere difende solo il lato dove si trova la sua torretta: le torrette di sinistra colpiscono solo i lupi sul lato sinistro, quelle di destra solo i lupi sul lato destro.
   - Ogni arciere deve però arrivare a tutto il suo lato, dall'angolo in alto all'angolo in basso (compresi i cancelli), sia dentro che fuori dalle mura.
   - La portata di 27-29 metri è già stata tolta: la `gittata` in `CONFIG.miglioramenti.torretta` è tornata quella originale (8 metri, 9 con "Potenzia arcieri", 10 con "Potenzia arcieri 2"). Nel Gruppo 3 resta da fare che ogni arciere copra tutto il suo lato (da un angolo all'altro, dentro e fuori) senza mai arrivare all'altro lato; con i potenziamenti diventa più forte e più veloce, ma non deve mai arrivare all'altro lato.

## GRUPPO 4: CORSA

15. Riporta la corsa alla lunghezza originale, ma tieni le due porte che sono state aggiunte.

16. Boss di fine corsa: alla fine della corsa c'è un ORSO GIGANTE.
   - I boscaioli lo affrontano tutti insieme: ogni boscaiolo gli toglie vita, e se i boscaioli finiscono prima che l'orso sia sconfitto la corsa è persa.
   - Si vede la barra della vita dell'orso e il numero dei boscaioli che diminuisce durante lo scontro.
   - Ogni volta che viene sconfitto, l'orso della corsa successiva diventa più forte (più vita), quindi servono sempre più boscaioli: il giocatore deve scegliere le porte migliori.
   - Quando l'orso viene sconfitto, il bottino del carro viene portato alla base, con un piccolo bonus.
   - Mostra il livello dell'orso (es. "Orso livello 3") prima dello scontro.
   - Il livello raggiunto dall'orso resta salvato.
   - L'orso è in stile cartoon come gli altri personaggi della Fase 3, grande e minaccioso ma simpatico.

---

## Note già decise (dalle sessioni precedenti)

- **Gruppo 2, cancello della corsa**: il cerchio CORSA andrà in alto al centro, appena dentro il muro (circa x 0, z -6). I cerchi "Mura" (x 3,2, z -5,9) e "Riparazione" (x -3,2, z -5,9) sono già stati messi ai suoi due lati, senza sovrapporsi. La corsia centrale (x ≈ 0) è lasciata libera per arrivarci.
- **Gruppo 2, torrette**: oggi le due torri stanno a metà dei lati sinistro e destro (z -0,3), proprio dove andranno il cancello della foresta (centrato a sinistra) e il nuovo cancello di destra: andranno spostate.
- **Gruppo 2, monete**: il cerchio unico delle monete va tra i due sportelli, dal lato interno (circa x 0, z 5). Il cerchio del venditore oggi è a x 0, z 2,7: va controllato che non si sovrappongano.
- **Gruppo 2, mura**: i danni progressivi (crepe, schegge, punte rotte, pali storti e spezzati, tremore con schegge e neve quando un lupo morde) vanno adattati alla nuova forma a tronchi orizzontali. Oggi sono in `src/segheria/mura.js` (`colpisci`, `sistemaPalo`).
- **Gruppo 2, pavimento**: la neve a terra è già fatta (`src/segheria/neveATerra.js`); resta da togliere il grande cerchio grigio ("radura" in `src/segheria/ambiente.js`) e aggiungere i due pavimenti da comprare.
- **Gruppo 2, mura (decisione dell'utente)**: le mura sono fatte **solo di pali verticali fitti** come in distanza-pali.png (quasi attaccati); i tronchi orizzontali sul lato interno sono stati provati e poi tolti su richiesta dell'utente. Il metallo sono fasce e bulloni sui pali, dentro e fuori.
- **Gruppo 2, fatto**: quattro torri, due per lato (MAPPA.torri: x ±11,2, z -4,2 e z 2,8); le due nuove costano 250 monete; gittata degli arcieri tornata a 8 / 9 / 10 metri; tolta la dispensa (la carne della corsa va sul tavolo dello sportello CARNE) e il banco del cacciatore è al suo posto, nella colonna di destra; il cacciatore esce dal cancello di destra; pavimenti a 300 monete ciascuno.
- **Gruppo 2, cerchi**: i miglioramenti sono in due file (DIFESA ed ECONOMIA, `CONFIG.file`): di ogni fila si vede solo il prossimo acquisto, nel suo posto accanto a quello che compra (`MAPPA.miglioramenti`, un posto per livello), e dopo l'acquisto il cerchio si sposta nel posto del successivo; i pavimenti compaiono dopo aver assunto aiutante, venditore e cacciatore. Per aggiungere un acquisto in una fila basta aggiungere [catena, livello] in `CONFIG.file`.
- **Gruppo 3, torrette**: `Torrette` in `src/segheria/torrette.js` gestisce già quattro torri (una per posto di MAPPA.torri); "Potenzia arcieri" inquadra tutte le torri con `zoomPerVedere`.
- **Gruppo 4, corsa**: la salita finale attuale (`src/corsa/sfidaFinale.js`) andrà sostituita dallo scontro con l'orso.
- **Dopo i gruppi**: Fase 4 (suoni) e Fase 5 (guadagni offline), poi le espansioni di `PIANO-ESPANSIONI.md`.
