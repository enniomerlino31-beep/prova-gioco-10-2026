# Piano dei gruppi di modifiche (prima delle Fasi 4 e 5)

> **Stato (aggiornato il 2026-10-27):**
> - **Fatti, provati e approvati dall'utente, e salvati:** Gruppi 1, 2 e 3 (con le richieste A pavimento, B Gruppo 5, C due cacciatori e la fila ECONOMIA a coppie), Gruppo A (monete, boscaiolo secondario, guadagni offline), Gruppo B (suoni veri, musica, impostazioni) e Gruppo C (lupi, mura, lupo gigante). Ultimo commit di codice: Gruppo C = 2bc4372.
> - **Gruppo 4 (corsa con 10 coppie di porte, più alberi, orso gigante con scontro dinamico, scalinata fino a ×20): fatto, provato e approvato dall'utente e salvato (2026-10-27, commit 0b4c5f9).** Vedi "GRUPPO 4: COSA È STATO FATTO" e le correzioni qui sotto.
> - **Mancano:** Gruppo 5 (edificio della segheria in stile cartoon), poi le espansioni di `PIANO-ESPANSIONI.md`. Prima del Gruppo 5 si aspetta il messaggio dell'utente.
> - Le sezioni qui sotto dei Gruppi A, B e C sono il racconto di com'è andato il lavoro (richieste, prove, decisioni): servono come storia, non sono cose da rifare.

Come si lavora: un gruppo alla volta; dopo ogni gruppo una verifica veloce (il gioco lo prova l'utente, niente partite di prova lunghe), aggiornare il README e dire cosa è stato fatto. Commit solo quando lo dice l'utente. Se la sessione sta per finire, fermarsi alla fine di un gruppo e dirlo.

Qui sotto c'è il testo dei gruppi così come l'ha scritto l'utente.

---

## GRUPPO A: CONTATORE DELLE MONETE, BOSCAIOLO SECONDARIO E GUADAGNI OFFLINE (da fare per primo)

A1. Cerchio delle monete: sopra il cerchio delle monete tra i due sportelli deve vedersi quante monete ci sono dentro, con l'icona della moneta e il numero (per esempio "120"). Il numero si aggiorna quando i clienti pagano e quando le raccolgo. Se il cerchio è vuoto, il numero sparisce o mostra 0 (scegli tu e dimmi cosa hai scelto). Deve leggersi bene e non sovrapporsi a cerchi, scritte o insegne.

A2. Nuovo lavoratore "Boscaiolo secondario":
- Si compra con un nuovo cerchio nella fila ECONOMIA, dopo i quattro lavoratori (Aiutante, Cacciatore, Venditore, Secondo cacciatore), a 500 monete.
- Ogni 5 minuti fa una corsa da solo: esce dal cancello della corsa, sparisce nella foresta e dopo 5 minuti torna con 250 pezzi di legna, che scarica sulla catasta. Poi riparte.
- Ha un suo colore, come gli altri lavoratori, ed è in stile cartoon. Mentre torna, la legna si vede (per esempio su una slitta o sulla schiena).
- Sopra il cerchio CORSA (o vicino al cancello) un piccolo conto alla rovescia mostra tra quanto torna.
- Funziona sia mentre gioco sia quando sono via.
- Il numero di minuti e di pezzi di legna mettili in config.js, così si possono cambiare facilmente.

A3. Guadagni offline (Fase 5): quando chiudo il gioco e lo riapro, la base ha continuato a lavorare.
- Mentre sono via, il boscaiolo secondario continua a portare 250 pezzi di legna ogni 5 minuti sulla catasta.
- La legna diventa monete solo se viene venduta: calcola le vendite offline in base a quanto riescono a vendere davvero i miei lavoratori e i clienti (aiutante, venditori e loro potenziamenti), non più veloce di come succederebbe giocando. Senza aiutante e venditore la legna resta nella catasta e non diventa monete. Fai lo stesso con la carne se ci sono i cacciatori, ma solo se è semplice: altrimenti dimmelo.
- Massimo 24 ore: oltre le 24 ore non succede più niente, né legna né vendite.
- Sotto i 2 minuti di assenza non succede niente.
- Mentre sono via i lupi non fanno danni.
- Al ritorno compare una schermata "Bentornato!" con quanto tempo sono stato via, quanta legna ha portato il boscaiolo secondario e quante monete ho guadagnato (con le icone), e un pulsante "Raccogli". Premuto il pulsante, le monete vanno nel cerchio delle monete e la legna non venduta resta nella catasta.
- Se l'orologio del telefono va indietro o fa cose strane, non deve dare monete in più né rompere il salvataggio.
- La schermata non deve comparire durante il tutorial.
- Aggiungi un modo per provarlo senza aspettare: per esempio ?offline=60 nell'indirizzo per fingere di essere stato via 60 minuti. Scrivilo nel README tra i comandi.
- Dimmi i numeri: quante monete all'ora si guadagnano offline con i vari lavoratori. Se superano le 1.000 monete all'ora, fermati e chiedimelo prima di andare avanti.

**Decisione dell'utente (2026-10-25), dopo i conti:** con 250 pezzi ogni 5 minuti offline si guadagnavano circa 6.000 monete all'ora (la legna che arriva si vende tutta: i clienti ne chiedono circa 4,7 pezzi al secondo e l'aiutante ne porta circa 4,8). L'utente ha scelto **"meno legna sempre"**: il boscaiolo secondario porta **40 pezzi ogni 5 minuti**, sia mentre si gioca sia offline (circa 960 monete all'ora + qualche mancia).

## GRUPPO B: SUONI (Fase 4, dopo il Gruppo A)

Suoni fatti dal codice (con il Web Audio del browser), senza file audio, così il gioco resta leggero.
STILE (corretto dall'utente il 2026-10-26): suoni **morbidi, rilassanti e realistici**, non elettronici e non buffi. (La prima versione chiedeva suoni "buffi": è superata.)
- Base: colpo d'ascia sul lupo, lupo che muore, morso alle mura, arrivo del lupo gigante (ululato buffo), freccia della torretta, monete raccolte, vendita allo sportello, mancia, pagamento in un cerchio, acquisto completato, cancello che si apre, ritorno del boscaiolo secondario con la legna.
- Corsa: passaggio da una porta buona e da una porta cattiva, albero abbattuto, boscaiolo perso, vittoria e sconfitta.
- Tutorial e "Bentornato!": suono di festa.
- Un pulsante sempre visibile per togliere e rimettere l'audio (icona dell'altoparlante), che resta salvato.
- Volume moderato. Se tanti suoni uguali arrivano insieme (per esempio molte monete), non devono sommarsi in un rumore forte: limita quanti ne partono insieme.
- Sul telefono l'audio parte solo dopo il primo tocco: fai in modo che funzioni comunque.
- Niente musica di sottofondo per ora.

Regole per tutti e due i gruppi A e B:
- Prezzi, regole e aspetto del resto del gioco non cambiano.
- I salvataggi già esistenti devono continuare a funzionare.
- Verifica veloce, niente partite di prova lunghe: il gioco lo prova l'utente. Alla fine di ogni gruppo usare Chrome DevTools solo per aprire il gioco e controllare che nella console non ci siano errori.
- Aggiornare README e PIANO-GRUPPI.md.
- Niente commit: aspettare la prova dell'utente.
- Se la sessione sta per finire, fermarsi e dire a che punto si è.
- Alla fine di ogni gruppo scrivere in poche righe cosa è stato fatto, le decisioni prese da soli e cosa controllare nella prova.

## GRUPPO B, SECONDA VERSIONE: SUONI VERI E MUSICA (in corso)

Ho provato i suoni: sono fastidiosi. Per "cartoon" intendevo suoni morbidi, rilassanti e realistici, non suoni elettronici o buffi. NON fare il commit di questa versione: i suoni costruiti dal codice vanno sostituiti con file audio veri. Il pulsante dell'audio invece va bene e lo teniamo.

COME TROVARE I SUONI
- Cerca e scarica suoni gratuiti con licenza CC0 (liberi da diritti, usabili anche in un gioco da vendere), per esempio da Kenney.nl, OpenGameArt (solo CC0) o Freesound (solo CC0). Non usare suoni con altre licenze.
- Stile: realistico ma morbido e rilassante. Volumi bassi, niente suoni acuti, secchi o stridenti. Il gioco deve essere piacevole da ascoltare anche dopo 30 minuti.
- Se non riesci a scaricare i file, o non trovi suoni adatti per qualcosa, fermati e dimmelo prima di inventare altre soluzioni.

ELENCO DEI SUONI (sostituisci tutti quelli attuali e aggiungi quelli nuovi)

Base:
- passi del mio boscaiolo: morbidi sulla neve, diversi sul pavimento in pietra. Gli altri personaggi non fanno rumore di passi;
- colpo d'ascia sul lupo, lupo che muore, morso alle mura, arrivo del lupo gigante (ululato profondo);
- freccia scoccata dalla torretta (suono della corda dell'arco e del sibilo della freccia) e freccia che colpisce;
- monete raccolte, vendita allo sportello, mancia, pagamento in un cerchio, acquisto completato;
- legna o carne che arriva sulla schiena, deposito allo sportello;
- cancello di legno che si apre e si chiude;
- ritorno del boscaiolo secondario con la slitta (slitta sulla neve e tronchi scaricati sulla catasta).

Costruzioni, con un suono legato al materiale:
- mura di legno: colpi di martello e legno;
- mura di pietra: pietre appoggiate e sfregate;
- rinforzo in metallo: colpi di metallo, ferro e bulloni;
- il suono accompagna l'onda che fa il giro della base, senza diventare un rumore continuo fastidioso (per esempio colpi ogni tanto mentre l'onda avanza);
- torrette: quando si costruiscono o cambiano materiale insieme alle mura, stesso tipo di suono del loro materiale; quando si potenziano gli arcieri, un suono di armatura e metallo;
- pavimento in pietra: lastre di pietra appoggiate mentre il pavimento si allarga;
- banco del cacciatore e altri lavoratori che compaiono: un suono breve di comparsa.

Corsa:
- corsa dei boscaioli: un unico suono di passi di gruppo sulla neve che si ripete, più pieno quando la squadra è grande e più leggero quando è piccola (non un passo per ogni boscaiolo);
- carro che avanza (ruote di legno sulla neve, leggero);
- porta buona e porta cattiva;
- albero abbattuto, boscaiolo perso (rocce e lupi);
- scalata della scalinata finale: passi sui gradini mentre la squadra sale, e un suono quando un boscaiolo resta indietro su un gradino;
- vittoria e sconfitta.

Menu e feste:
- pulsanti dei menu, comparsa di un nuovo cerchio di miglioramento;
- festa a fine tutorial e al "Bentornato!".

Aggiungi anche ogni altro suono utile che trovi nel gioco e fammi l'elenco completo di tutti i suoni con la loro fonte.

MUSICA DI SOTTOFONDO (sempre CC0)
- Una per la base: calma e rilassante, per esempio chitarra acustica o pianoforte, atmosfera di montagna innevata.
- Una per la corsa: un po' più energica ma sempre morbida.
- Si ripetono senza stacchi, passano dolcemente dall'una all'altra e hanno un volume più basso degli effetti.

VOLUME E PULSANTI
- Tieni il limite di suoni uguali che partono insieme e il compressore, così con tanti lupi, frecce e monete non diventa rumore.
- Due pulsanti sempre visibili, salvati come quello di adesso: uno per la musica e uno per gli effetti.

LEGGEREZZA
- Comprimi i file (mp3 o ogg). Tutti i suoni insieme devono stare sotto i 3 MB.
- La musica si carica dopo l'avvio del gioco, così l'apertura resta veloce.
- Metti i file in public/suoni/ e crea un file CREDITI-SUONI.md con, per ogni suono, da dove viene e la licenza.

Regole come prima: aggiorna README e PIANO-GRUPPI.md, verifica veloce con Chrome DevTools (nessun errore in console), niente commit prima della prova dell'utente, fermati se la sessione sta per finire.
Alla fine: quanto pesano in tutto i suoni, le decisioni prese da soli e cosa controllare.

### GRUPPO B, ULTIMA RICHIESTA (2026-10-26, da provare)

1) **Suoni che si interrompono durante il taglio degli alberi**: NON sono riuscito a riprodurlo. Provato con Chrome DevTools (squadra da 4, 8, 40 e 100 boscaioli, anche con CPU 6 volte più lenta, alberi tagliati uno dopo l'altro, con un misuratore di livello sull'uscita della musica e su quella degli effetti): la musica non si ferma mai, l'audio resta "running", nessun errore in console. Quello che si ferma per costruzione durante il taglio sono i passi, il carro e le grida "ogni tanto" (partono solo mentre la squadra corre): prima non c'era nessun altro effetto, quindi restava solo la musica. Per sicurezza ho reso l'audio più robusto contro le tre cause possibili: (a) un errore in un punto del gioco ora non ferma più il ciclo (prima un errore in `corsa.aggiorna` avrebbe fermato anche `suoni.aggiorna`, quindi la musica sarebbe finita dopo circa 1 secondo); (b) un fotogramma molto lento (telefono) non lascia più buchi: le ripetizioni sono preparate 3 secondi prima (`ANTICIPO` in `suoni.js`) e se si resta indietro riparte da adesso; (c) se il browser mette in pausa l'audio (telefono), ogni secondo si prova a farlo ripartire. Se capita ancora, servono: telefono o computer, browser, e se anche il gioco si ferma. 2) **Colpi d'ascia sul legno** durante il taglio (Kenney impactPlank_medium_002-004, CC0): ritmo `max(0,2 s, 1/radice(boscaioli))`, al massimo 2 insieme, volume di ogni colpo un po' a caso. Decisione: ho usato suoni di Kenney (già usati per altri effetti) invece di un nuovo autore. Suoni in tutto 1,3 MB (71 file).

### GRUPPO B, TERZA PROVA (2026-10-26)

L'utente: il cambio tra le musiche era brusco e piaceva solo la musica "con le chitarre". Fatto: **una sola musica per tutto il gioco**, "A Ukulele Tune" di shaunhillyard (Freesound 830500, CC0; file `public/suoni/musica.mp3`, 22 s, tagliato il silenzio all'inizio e alla fine), usata sia nella base sia nella corsa (`MUSICHE` in `suoni.js` punta allo stesso file e il cambio di musica avviene solo se il FILE cambia, quindi nessun riavvio); il loop usa una dissolvenza di 1 s (`SFUMATURA_MUSICA`) a potenza costante (seno/coseno). Tolti BirdFish Happy Loop (marimba), Aurora Ride (nessuno strumento indicato) e Upbeat_Loop CMaj 135 (sintetizzatore e batteria) dal gioco e dai crediti; Etirwer (chitarra classica) era già stato tolto prima. **Scelta del brano**: nessuno dei quattro brani della prova aveva "chitarra" nella descrizione; l'unico con uno strumento a corde è l'ukulele (che è una piccola chitarra), quindi ho scelto quello. Se l'utente intendeva un'altra musica (per esempio Etirwer, chitarra classica, scaricabile da https://opengameart.org/content/etirwer), basta dirlo. Suoni in tutto 1,3 MB (68 file).

### GRUPPO B, SECONDA PROVA (2026-10-26)

Richieste: 1) volumi più bassi (circa la metà), con la musica sempre sotto gli effetti e i numeri in `config.js` (`CONFIG.audio`: effetti 0,5, musica 0,15, la musica al massimo il 40% degli effetti); 2) musiche più vivaci e allegre, CC0 (base: BirdFish Happy Loop + A Ukulele Tune; corsa: Upbeat Game Loop - Aurora Ride + Upbeat_Loop_CMaj 135 bpm; **non ascoltate da me**, scelte da titolo, tonalità maggiore e descrizione); 3) ingranaggio con menu delle impostazioni al posto dei due pulsanti audio (gioco in pausa, interruttori grandi, Esc o tocco fuori per chiudere); 4) grida dei boscaioli nella corsa (6 file CC0: Hey, Yeah, Woo-hoo; porta buona, albero abbattuto e ogni 5-9 s, mai più di una ogni 3,5 s; **non ascoltate da me**); 5) movimento della squadra più fluido (molla smorzata, inclinazione, onda tra le file; numeri in `CONFIG.squadra`). Decisioni prese da soli: nessun grido per le porte cattive; nessun "Ooh!" (non ho trovato un file CC0 adatto); aggiunto `?corsa` per provare subito la corsa. Verifica: console senza errori nuovi (solo il 404 di favicon.ico), menu provato in formato telefono, corsa con CPU 4 volte più lenta a 60 fotogrammi al secondo (con una sola squadra di 1 boscaiolo: la squadra grande non l'ho provata). Suoni in tutto 2,0 MB.

### GRUPPO B, SECONDA VERSIONE, MODIFICHE DOPO LA PRIMA PROVA (2026-10-26)

Richieste dell'utente: 1) tolto del tutto il suono delle frecce; 2) cancello più morbido, breve e basso (fatto: "toc" sordo); 3) musica allegra, serena e chill (fatto: Etirwer per la base, Happy Clappy Loop per la corsa, CC0); 4) suoni troppo lontani e ovattati; 5) qualità bassa. **Causa del "lontano"**: nel codice non c'è nessun riverbero e nessun calo di volume con la distanza; la colpa era dei file, filtrati due volte con un passa-basso a 3000-5000 Hz (acuti tagliati = ovattato), compressi a 48 kbps mono e con volume basso (media -18 dB, poi moltiplicata per 0,3-0,4 e per 0,8, sotto un compressore con soglia -22 dB e rapporto 6). Ora: nessun filtro, 96 kbps, media -16 dB, volumi alzati circa del 70%, compressore leggero (soglia -14, rapporto 3), variazione del tono ridotta a ±4%. Decisioni prese da soli: tolti sia il suono di partenza sia quello d'impatto delle frecce; la musica della corsa è scelta solo dai dati (tonalità maggiore, ma con poca certezza), **nessuna musica ascoltata da me**. Pesano 2,2 MB (63 file). Limite di qualità: ululato, guaito, slitta, carro e passi di gruppo vengono da anteprime Freesound (mp3 già compressi).

### GRUPPO B, SECONDA VERSIONE: FINITO IL 2026-10-26 (da provare dall'utente)

Ripresa la sessione: tutti i file passano il controllo di sintassi; provato con Chrome DevTools (nessun errore, solo il 404 di favicon.ico che c'era già): i 64 mp3 si caricano, le musiche dopo l'avvio, i due pulsanti spengono/riaccendono e restano salvati. Scritto `CREDITI-SUONI.md` e riscritto il README. Pesano 1,7 MB in tutto. **Non ascoltati da me** (scelti a orecchio): lupo-muore, jingle di porte/acquisto/vittoria/sconfitta/festa, ululato: l'utente dica se qualcuno è fastidioso. Poi commit e Gruppo C.

#### Stato della sessione interrotta (2026-10-25) (sessione interrotta per il limite di utilizzo)

**Fatto (scritto nel codice, compila senza errori, NON provato nel browser, NON committato):**
- Trovati e scaricati suoni CC0 veri: pacchetti Kenney.nl (RPG Audio, Impact Sounds, Interface Sounds, UI Audio, Casino Audio, Music Jingles, tutti "Creative Commons CC0") e anteprime CC0 da Freesound (ululato 500646 betchkal, guaito 452202 kyles, arco 384918 Ali_6868, freccia che colpisce 205938 Twisted_Euphoria, slitta 450847 kyles, corsa nella neve 712022 AudioPapkin, carro 721122 SoundsLikeYukon, musica base 859607 blankie.rest, musica corsa 731511 kanaizo). Scaricati nello scratchpad della sessione (si possono riscaricare dagli stessi link).
- 64 file mp3 mono già pronti in `public/suoni/` (tagliati, acuti smussati, volume pareggiato): in tutto circa **1,7 MB** (limite 3 MB). Lo script che li crea è `crea-suoni.mjs` nello scratchpad (non nel progetto): usa ffmpeg-static; se serve rifarli, riscrivere lo script dall'elenco in `src/motore/suoni.js`.
- `src/motore/suoni.js` riscritto: effetti da file (più varianti a caso, tono leggermente variabile, `pausa` e `insieme` per ogni effetto, compressore), suoni continui (`suoni.ciclo`) e musica (`suoni.musica`) con dissolvenze, musiche caricate 2,5 s dopo l'avvio, due uscite separate (effetti e musica), impostazioni `musica` ed `effetti` salvate in `segheria-assediata-impostazioni`.
- Due pulsanti in `index.html`, `stile.css`, `main.js` (altoparlante = effetti, nota = musica); clic sui pulsanti dei menu; musica base nella base e musica corsa nella corsa.
- Agganci nel codice: passi del boscaiolo (neve/pietra, `alPasso` + `pavimento.copre`), ascia, lupo che muore, morso (normale e gigante), ululato, frecce (tiro e colpo), monete, vendita, mancia, pagamento, acquisto, legna/carne sulla schiena e sugli sportelli, cancelli (apre e chiude), slitta e tronchi del boscaiolo secondario, costruzioni per materiale (onda delle mura in `mura.js`, torri in `torrette.js`, armatura, lastre del pavimento), comparsa di lavoratori e banco, nuovo cerchio, corsa (passi di gruppo che diventano più pieni con tanti boscaioli, carro, porte, albero, boscaiolo perso, gradini, "resta indietro", vittoria, sconfitta), feste.

**Manca (da fare alla prossima sessione, in quest'ordine):**
1. Provare nel browser con Chrome DevTools (nessun errore in console, i file mp3 si caricano, i suoni partono dopo il primo clic, i due pulsanti spengono e riaccendono e restano salvati; in particolare controllare che `suoni.musica('base')` non dia problemi e che i cicli della corsa non lascino suoni accesi dopo la fine della corsa). Il server di prova era acceso su http://localhost:5173.
2. Controllare l'ascolto: i suoni devono risultare morbidi (se qualcuno è ancora secco o acuto, cambiare file o abbassare `passaBasso`/volume nello script e rifarlo). Alcuni suoni sono stati scelti a orecchio dai nomi e dalle misure, non ascoltati: soprattutto `lupo-muore` (guaito di cane), `porta-buona`/`porta-cattiva`/`acquisto`/`vittoria`/`sconfitta`/`festa` (jingle Kenney) e `ululato`. Se non vanno, dirlo all'utente.
3. Scrivere `CREDITI-SUONI.md` (per ogni suono: da dove viene e licenza CC0) con l'elenco completo delle fonti (l'utente lo chiede) e linkarlo nel README.
4. Aggiornare il README (la sezione "Suoni cartoon" descrive ancora la versione vecchia fatta dal codice: va riscritta con suoni veri, musica, due pulsanti e peso totale) e la nota "decisioni prese da soli" nel piano.
5. Possibili dimenticanze da verificare: suono "pulsanti dei menu" (fatto con un unico clic), cancello che si chiude (fatto solo quando si allontana chi lo apre), suoni dei cacciatori/aiutante (solo quello di comparsa).
6. Dopo la prova dell'utente: commit (con l'attribuzione richiesta) e poi Gruppo C.

## GRUPPO C: LUPI, MURA E LUPO GIGANTE (fatto, provato e approvato dall'utente, salvato il 2026-10-26: commit 2bc4372)

C1. Lupi più deboli e mura più resistenti:
- Le mura hanno il doppio della vita a ogni livello: legno 360, pietra 800, metallo 1500. Aggiorna anche la riparazione e la barra della vita.
- Il morso dei lupi alle mura fa metà danno di adesso, anche quello del lupo gigante.
- Il numero di colpi d'ascia e di frecce per uccidere i lupi resta uguale.
- Metti tutti i numeri in config.js.

C2. Se le mura vengono distrutte, la partita è persa:
- Prima di cambiare, dimmi cosa succede oggi quando la vita delle mura arriva a 0.
- Quando la vita delle mura arriva a 0, compare una schermata "Le mura sono cadute!" con un pulsante "Ricomincia".
- Premuto il pulsante si perde tutto: monete, legna, carne, miglioramenti, lavoratori, boscaiolo secondario e monete messe nei cerchi. Si riparte con la base come all'inizio del gioco.
- Il tutorial NON si rifà: risulta già finito. Restano salvate anche le impostazioni (per esempio l'audio spento).
- Quando le mura scendono sotto il 25% della vita, compare l'avviso "Le mura stanno cedendo! Riparale!" al centro dello schermo, al massimo una volta ogni 30 secondi.
- Mentre sono via dal gioco le mura non perdono vita.
- Aggiungi i suoni cartoon per l'allarme delle mura e per le mura cadute, nello stesso stile del Gruppo B.

C3. Arrivo del lupo gigante:
- Quando arriva il lupo gigante, la telecamera va dolcemente su di lui (come quando si compra un miglioramento lontano), lo mostra per circa 2-3 secondi mentre compare la scritta "Arriva il lupo gigante!", e poi torna dolcemente sul boscaiolo. Intanto il boscaiolo resta fermo.
- Se il lupo è già ben visibile sullo schermo, la telecamera non si muove.
- Se in quel momento la telecamera sta già mostrando un acquisto, aspetta che abbia finito.

C4. Lupo gigante più bello e più cattivo:
- Più dettagliato e minaccioso, ma sempre nello stesso stile cartoon degli altri personaggi: pelo più folto e arruffato (soprattutto su collo e schiena), occhi rossi che brillano, zanne grandi, muso arrabbiato, qualche cicatrice, artigli visibili.
- Quando arriva, si ferma un attimo e fa un'animazione di ululato con la testa alzata verso il cielo, con un ululato profondo e minaccioso (sempre cartoon).
- Camminata più pesante e minacciosa di quella dei lupi normali.
- Deve restare leggero per il telefono.
- Alla fine usa Chrome DevTools per simulare un telefono lento e controllare che il gioco non scatti quando arriva il lupo gigante insieme ad altri lupi.

C5. Il lupo gigante deve avere molta più vita: ora muore subito e non è una vera sfida.
- Prima di cambiarlo, dimmi quanta vita ha adesso e quanti colpi d'ascia e frecce servono per ucciderlo.
- Dagli molta più vita, in modo che per ucciderlo servano circa 20-30 secondi di combattimento con il boscaiolo e le torrette a livello medio. Dimmi che numero hai scelto.
- Sopra il lupo gigante deve vedersi una barra della vita ben visibile, in stile cartoon, così capisco quanto manca per ucciderlo.
- Metti il numero della vita in config.js, così si può cambiare facilmente.
- Questa è un'eccezione alla regola del punto C1 ("il numero di colpi per uccidere i lupi resta uguale"): la regola vale per i lupi normali, non per il lupo gigante.
- Resta valido quello che dice C1: il morso del lupo gigante alle mura fa metà danno di adesso.

Per le prove: aggiungere un comando nell'indirizzo per provare subito l'arrivo del lupo gigante e la caduta delle mura (scritto nel README).

Stesse regole degli altri gruppi: verifica veloce, README e PIANO-GRUPPI.md aggiornati, niente commit prima della prova dell'utente, fermarsi se la sessione sta per finire. Finito il gruppo, fermarsi e dire cosa è cambiato e cosa controllare.

### GRUPPO C, TERZA PROVA: CERCHIO VERDE PIÙ GRANDE, AL CENTRO E CHE SI NOTA (2026-10-26, da provare)

Richieste: 1) il cerchio verde circa il doppio, il più grande della base, con numero e scritta grandi e leggibili sul telefono; 2) deve notarsi: compare "esplodendo" con un rimbalzo, poi pulsa e brilla di verde, la telecamera ci va per circa 2 secondi (e torna sul boscaiolo) se non si vede già, aspetta se c'è un'altra inquadratura in corso, suono di avviso; 3) esattamente al centro della base, spostando o coprendo scritte e cerchi che ci stanno, e dirlo; tutto come prima quando sparisce.
- **Fatto** (`CONFIG.muraAllarme`): `raggioCerchio` **3** (era 1,5; un cerchio normale è 1,2) e `durataTelecamera` **2** secondi; posizione `MAPPA.riparazioneMura` = (0, 0, −0,05), cioè il centro esatto tra le mura (x 0; z a metà tra il fondo −7,4 e il fronte 7,3). Nuovo file `cerchioRiparazione.js`: scoppio con rimbalzo di 1 secondo (supera di circa il 17%), pulsazione del 3,5% con disco che si schiarisce e un alone verde che si allarga e svanisce; la scritta è "RIPARA / LE MURA" su due righe, dentro il cerchio in alto (altezza dei caratteri circa 0,8 metri), con l'icona della legna e il numero (circa 1,1 metri) sotto. Suono nuovo `cerchio-riparazione` (tonfo morbido e campanellino, Kenney, CC0). La telecamera usa la regia dei miglioramenti (viaggio, 2 secondi di sosta, ritorno) con zoom calcolato per vedere tutto il cerchio; se il centro si vede già bene non si muove; il cerchio compare solo quando non c'è un'altra inquadratura (acquisto, lupo gigante).
- **Cosa ho spostato (decisione)**: niente è stato spostato in modo permanente. Finché il cerchio verde c'è, i cerchi e le scritte che si sovrappongono (con il raggio di 3 metri: il cerchio e la scritta del pavimento, il cerchio e la scritta del venditore o dell'aiutante, il boscaiolo secondario) **si rimpiccioliscono e spariscono** (`sospendi` e `occupa` in `miglioramenti.js`, senza suoni) e **tornano come prima appena il cerchio verde sparisce**; in quel periodo non si possono comprare. Non toccano il cerchio verde: il cerchio CORSA (z circa −6,4), i cerchi mura e riparazione in alto (z −5,9), i cerchi delle torrette, il cerchio del cacciatore, il banco, la catasta, gli sportelli e il cerchio delle monete. Provato con Chrome DevTools in formato telefono (screenshot): cerchio al centro, scritta e numero grandi e leggibili, nessuna sovrapposizione brutta; dopo la riparazione il cerchio dell'ECONOMIA (venditore) ricompare con scala 1 e nessun cerchio resta sospeso; con il boscaiolo fuori dalle mura la telecamera arriva in 1 secondo, il cerchio compare e dopo circa 4 secondi in tutto la telecamera è tornata; nessun errore in console.

### GRUPPO C, SECONDA PROVA: PASSI PIÙ BASSI E CERCHIO VERDE PER RIPARARE LE MURA (2026-10-26)

1) **Passi del boscaiolo** più bassi di circa un terzo (`passoNeve` 0,59 → 0,39, `passoPietra` 0,51 → 0,34 in `suoni.js`); gli altri suoni invariati.
2) **Com'era la riparazione**: si compra con le **monete** nel cerchio verde "Riparazione" in alto a sinistra (100 → 200 → 400) e poi ripara le mura **da sola**, lentamente (0,8 → 1,6 → 3,2 punti al secondo); non si paga con la legna e non c'era una riparazione a mano.
   **Cerchio nuovo** (`CONFIG.muraAllarme`: soglia 25% = quella dell'avviso, `legnaRiparazione` **50**, `raggioCerchio` 1,5): sotto il 25% compare il grande cerchio verde con la legna e il numero 50; il boscaiolo deposita la legna che porta (un po' alla volta); a 50 le mura tornano al massimo e il cerchio sparisce con un suono; resta finché le mura non sono al massimo (anche se risalgono sopra il 25%); la legna depositata resta nel cerchio se non basta. Funziona anche con il lupo gigante (solo mentre la telecamera lo guarda il boscaiolo è fermo).
   Decisioni prese da solo: **50 legna** (la riparazione costa 100 monete e la legna vale 2 monete l'una); il cerchio sta a destra del centro (x 3,0, z 0,3) e non proprio al centro, perché la corsia centrale è occupata dalle scritte del pavimento e del venditore (controllato con uno screenshot in formato telefono, anche con i cerchi del pavimento e del secondo cacciatore: non si sovrappone a niente); se le mura tornano al massimo per altre vie (riparazione automatica, mura nuove) il cerchio sparisce e tiene la legna già messa; nel salvataggio la legna già nel cerchio conta come legna della catasta (la vita delle mura non si salva: ricaricando le mura sono intere); suono nuovo `riparazione-mura` (martello e campanellino, Kenney, CC0). Provato con Chrome DevTools: 30 legna depositate (restano nel cerchio e nel salvataggio), poi altre 20 completano la riparazione (vita al 100%, cerchio nascosto, 20 legna restano al boscaiolo); nessun errore in console.

### GRUPPO C, MODIFICHE DOPO LA PRIMA PROVA (2026-10-26)

Richieste dell'utente dopo aver provato il lupo gigante: 1) più veloce e morsi più ravvicinati; 2) ogni morso fa più danno (la sua vita resta 400); 3) in tutto il suo attacco non toglie mai più del 25% della vita massima delle mura (per ogni livello, senza contare i lupi normali); 4) musica inquietante mentre c'è il lupo gigante, con dissolvenza di circa 2 secondi, niente se la musica è spenta, e si ferma se le mura cadono. Numeri (`CONFIG.lupoGigante`):
- velocità: 0,5 → **1,5** (tre volte);
- morsi: ogni 1,1-1,7 s → **ogni 0,5-0,8 s**;
- danno: prima 3,3 al secondo (circa 4,6 a morso) in continuazione → ora **8 punti a ogni morso** (circa 12 al secondo mentre morde);
- limite: **25%** della vita massima delle mura (legno 90, pietra 200, metallo 375), contato dall'arrivo fino alla morte del gigante (`dannoGigante` in `segheria.js`, si azzera a ogni arrivo; se si compra un livello di mura durante lo scontro il limite usa la vita massima nuova). Provato: con le mura di legno i morsi si fermano a 90 punti (vita 270 su 360). Il lupo gigante può comunque far cadere le mura solo se i lupi normali le hanno già portate quasi a zero.
- Musica: **"Action music loop with dark ambient drones"** di **burning-mir** (Freesound 155139, CC0): "un vecchio loop incompiuto fatto con FL Studio, con droni scuri e ambientali nella seconda metà che danno un tono misterioso"; tag: action, ambient, chase, dark, drone, ethereal, mysterious, tension; 29 secondi, "perfettamente in loop" secondo l'autore (con la dissolvenza di 1 secondo del loop). Scelta perché tesa e cupa, con tanti bassi e pochi acuti (sopra i 4 kHz ha meno energia della musica dell'ukulele in proporzione simile), ma **non l'ho ascoltata**: se è fastidiosa o troppo "d'azione", l'alternativa è "Dark Atmospheric Drone (Seamless Loop)" di kkenny101 (Freesound 865550, 2 minuti e 38, un drone scuro e leggero, più ambientale). `musica-paura.mp3`, 342 KB, in tutto i suoni pesano 1,7 MB (75 file).
- Come funziona: `suoni.impostaPaura(true)` all'arrivo del gigante e `false` quando muore, quando le mura cadono e quando si parte per una corsa (alla fine della corsa, se il gigante c'è ancora, torna); le musiche cambiano con una dissolvenza di 2 secondi (`SFUMATURA_CAMBIO`) e solo quando il nuovo brano è già pronto; con la musica spenta dalle impostazioni la musica "gira" a volume zero come sempre. Provato con Chrome DevTools: dissolvenze a 2 secondi senza buchi di volume in entrata e in uscita, musica spenta = silenzio, mura cadute col gigante vivo = musica inquietante ferma, nessun errore in console; con la CPU 4 volte più lenta e il gigante con 4 lupi normali la mediana passa da 18,2 a 19,7 ms (massimo 66 ms).
- Decisioni prese da solo: velocità 1,5 (una volta e mezza un lupo normale: l'avvicinamento è comunque breve perché i lupi partono vicino alle mura); 8 punti a morso (più del doppio di prima per morso); tolto `dannoMura` del gigante (ora conta solo il danno per morso); la musica inquietante parte subito all'arrivo, non quando la telecamera è arrivata.

### GRUPPO C: COSA È STATO FATTO (2026-10-26)

- **Com'era**: quando la vita delle mura arrivava a 0 non succedeva niente (la barra restava vuota, i lupi mordevano senza effetto, il gioco andava avanti). Il lupo gigante aveva 60 punti di vita: 10 colpi d'ascia (6 punti ciascuno) o 20 frecce (3 punti), cioè circa 5 secondi con il boscaiolo e meno di 15 con le torrette.
- **C1** (`config.js`): mura 360 / 800 / 1500 (`CONFIG.segheria.hpMura`, `CONFIG.miglioramenti.mura`); morso dei lupi alle mura 1,1 al secondo (era 2,2; il gigante fa 3 volte quello, quindi 3,3 al posto di 6,6); la riparazione è raddoppiata (0,8 / 1,6 / 3,2 al secondo) per restare in proporzione con la vita doppia (decisione mia: altrimenti le mura si sarebbero riparate in tempo doppio); la barra della vita usa già la percentuale. Colpi per uccidere i lupi normali invariati.
- **C2**: `CONFIG.muraAllarme` (sotto il 25%, ogni 30 s, 3 s di scritta); `controllaMura` e `cadonoLeMura` in `segheria.js`: la caduta si controlla subito dopo i morsi, prima della riparazione automatica (altrimenti con la riparazione comprata le mura non sarebbero mai cadute); `ricominciaDaCapo()` in `salvataggio.js` scrive la partita nuova con il tutorial finito e la pagina si ricarica (le impostazioni audio sono in un'altra memoria); le mura non perdono vita durante le corse e mentre si è via (non si salva nemmeno la vita delle mura). Suoni nuovi (Kenney, CC0): campana per l'allarme, crollo di legno per le mura cadute.
- **C3**: `arrivaGigante` in `segheria.js`: usa la regia della telecamera dei miglioramenti (1 s di viaggio, `sostaTelecamera` 2,6 s, poi ritorno) senza testo verde; se il punto si vede già bene non si muove; se c'è già una regia in corso il lupo gigante aspetta; il boscaiolo resta fermo (come per i miglioramenti); la scritta e l'ululato partono quando la telecamera è arrivata.
- **C4**: `modelli/lupo.js` (occhi rossi che brillano e non lampeggiano, criniera e spalle, collare di pelo, cicatrici, zanne grandi, mascella che si apre; sono pochi pezzi uniti ai perni) e `modelli/animazioni.js` (`animaUlulato`, `animaPassoPesante`, bocca aperta quando morde); a ogni passo del gigante un tonfo e più neve. Provato con Chrome DevTools: con CPU 4 volte più lenta, 4 lupi normali più il gigante, il gioco resta a circa 50 fotogrammi al secondo (mediana 19,8 ms contro 18,1 senza il gigante, massimo 47 ms); con CPU 6 volte più lenta mediana 36 ms contro 32 senza il gigante; nessun errore in console.
- **C5**: 400 punti di vita (`CONFIG.lupoGigante.vita`): un colpo d'ascia ne toglie 6 (67 colpi), una freccia 3 / 5 / 8. Scelta: "livello medio" = il boscaiolo che colpisce (circa 8 punti al secondo, non sempre vicino) più le due torrette del suo lato con "Potenzia arcieri" (circa 8 punti al secondo) = circa 16 punti al secondo, quindi circa 25 secondi. Con tutto comprato (torrette da 8 punti) muore in circa 16 secondi, con le sole due torrette base e il boscaiolo in circa 35. Barra: `segheria/barraGigante.js`, cartellino cartoon con contorno scuro, tacche ogni 10%, colore verde / giallo / rosso e il numero dei punti di vita.
- **Decisioni prese da solo**: la riparazione raddoppiata; la scritta "Arriva il lupo gigante!" dura 2,6 s (era 2); ho aggiunto `?gigante` e `?mura=N`; la schermata delle mura cadute compare 1,2 secondi dopo il crollo (schegge e suono); il lupo gigante arriva anche se la telecamera era già su un acquisto, ma solo dopo che quest'ultima ha finito.

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

## GRUPPO 3: TORRETTE E ARCIERI (fatto)

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

15. (SUPERATO dalle decisioni qui sotto) Riporta la corsa alla lunghezza originale, ma tieni le due porte che sono state aggiunte.

16. (SUPERATO dalle decisioni qui sotto) Boss di fine corsa: alla fine della corsa c'è un ORSO GIGANTE.
   - I boscaioli lo affrontano tutti insieme: ogni boscaiolo gli toglie vita, e se i boscaioli finiscono prima che l'orso sia sconfitto la corsa è persa.
   - Si vede la barra della vita dell'orso e il numero dei boscaioli che diminuisce durante lo scontro.
   - Ogni volta che viene sconfitto, l'orso della corsa successiva diventa più forte (più vita), quindi servono sempre più boscaioli: il giocatore deve scegliere le porte migliori.
   - Quando l'orso viene sconfitto, il bottino del carro viene portato alla base, con un piccolo bonus.
   - Mostra il livello dell'orso (es. "Orso livello 3") prima dello scontro.
   - Il livello raggiunto dall'orso resta salvato.
   - L'orso è in stile cartoon come gli altri personaggi della Fase 3, grande e minaccioso ma simpatico.

### GRUPPO 4: DECISIONI DELL'UTENTE (2026-10-27) — SOSTITUISCONO IL TESTO VECCHIO DEI PUNTI 15 E 16

**Corsa**
- La corsa resta di **600 m**. Il punto "tieni le due porte aggiunte" non vale più.
- Le porte passano da 7 a **10 coppie**, distribuite lungo tutta la corsa. Le porte buone sono più generose nella seconda metà (×3, ×4, ×5 e somme grandi), così chi sceglie sempre bene può arrivare a fine corsa con diverse centinaia di boscaioli, anche oltre 1.000 nelle corse fortunate.
- **Porte entrambe rosse**: circa 2 coppie su 10 hanno tutte e due le porte che tolgono boscaioli, diverse tra loro (una toglie un numero fisso, −10, −20…, l'altra divide, ÷2, ÷3), così la scelta migliore dipende da quanti boscaioli si hanno. Mai nella prima coppia e mai nella prima corsa (tutorial).
- **Più alberi**, così la legna della corsa è una parte importante del bottino; se serve spazio, un po' meno rocce e lupi. Dire quanta legna si raccoglie in media prima e dopo.
- **Telefono**: con squadre enormi non si disegnano tutti i boscaioli (c'è un limite), ma il numero scritto sopra la squadra è sempre quello vero. Vale anche nello scontro con l'orso e sulla scalinata.

**Fine corsa: l'orso protegge la scalinata**
1. Alla fine della corsa, davanti alla scalinata, c'è un **ORSO GIGANTE**. Prima dello scontro compare la scritta "Orso livello N".
2. Quando la squadra arriva, la telecamera si ferma e inquadra l'orso e lo scontro finché non finisce. Il carro resta fermo dietro la squadra.
3. Scontro **automatico** (il giocatore guarda): i boscaioli corrono verso l'orso a ondate; ogni boscaiolo che lo colpisce gli toglie 1 punto di vita e sparisce; l'orso dà zampate e ogni zampata fa volare via qualche boscaiolo. Si vedono la barra della vita dell'orso e il numero dei boscaioli che scende. Faticoso ma non lungo: circa 5–8 secondi.
4. Orso sconfitto: i boscaioli rimasti salgono la scalinata. Dopo la scalinata, al bottino si aggiungono **100 unità di carne dell'orso**, **non moltiplicate** dalla scalinata.
5. Boscaioli finiti prima: corsa persa, si porta alla base **solo la legna raccolta durante la corsa** (dagli alberi), senza moltiplicatori e senza carne, con un messaggio chiaro nel riepilogo.

**Quanto è forte l'orso**
- Molto forte e resistente, ma non impossibile: chi sceglie bene le porte vince faticando (gli restano pochi boscaioli per la scalinata), chi sceglie male perde. La vita si calcola da quanti boscaioli arrivano davvero a fine corsa con le 10 coppie di porte (scegliendo bene e a caso, considerando anche lupi e rocce).
- Una volta sconfitto, l'orso non compare per un numero a caso di corse **tra 3 e 5** (si va dritti alla scalinata). Quando ricompare, il livello è salito di 1 ed è più forte (di quanto lo scelgo io). Se si perde contro l'orso, alla corsa dopo c'è di nuovo lui, allo stesso livello.
- **Prima corsa (tutorial): l'orso non c'è**, si va dritti alla scalinata. La prima corsa deve restare vincibile e portare almeno 150 legna.
- Livello dell'orso e corse mancanti al suo ritorno restano **salvati**; "Ricomincia" del Gruppo C li azzera; i salvataggi vecchi partono dal livello 1. Tutti i numeri in `config.js`.

**Scalinata**
- Arriva fino a **×20** (più gradini, con i moltiplicatori scritti). Costo dei gradini ricalcolato (oggi cresce troppo in fretta, 1,35 a gradino): i gradini alti devono essere raggiungibili solo con squadre molto grandi, ma raggiungibili. Dire quanti boscaioli servono per ×10, ×15 e ×20.

**Aspetto e suoni**
- Orso marrone scuro, cartoon ma **cattivo**, più minaccioso del lupo gigante: enorme (circa il doppio), occhi rossi, zanne, artigli grandi, pelo arruffato, cicatrici, muso arrabbiato. All'arrivo si alza sulle zampe di dietro e ruggisce. Leggero per il telefono (pezzi uniti). Barra della vita grande in stile cartoon con il numero.
- Durante lo scontro parte la musica paurosa del lupo gigante (stessa dissolvenza) e poi torna la normale.
- Suoni: ruggito all'arrivo, zampate, colpi, orso che cade. Solo CC0, aggiornare `CREDITI-SUONI.md`.
- Comando nell'indirizzo per provare subito lo scontro, anche con un livello e un numero di boscaioli (per esempio `?orso=5&boscaioli=200`), scritto nel README.

**Verifica**: veloce (la prova la fa l'utente); alla fine Chrome DevTools con telefono lento per controllare lo scontro con tanti boscaioli (per esempio 300) e la scalinata alta, e la console senza errori. Niente commit prima della prova dell'utente.

### GRUPPO 4: COSA È STATO FATTO (2026-10-27, provato e approvato)

- **Porte**: 10 coppie; le somme crescono con la corsa (`crescitaSomme` 4: alla fine ×5), x3 dal 6% al 14%, x4 (dopo il 35% della corsa, fino all'8%) e x5 (dopo il 60%, fino al 4%); 2 coppie rosse (−N fisso e ÷2/÷3, N da 10 a 120). **Numeri a fine corsa** (simulazione di 4000 corse con il generatore vero; lupi e rocce stimati: chi sceglie bene li prende nel 15% dei casi, a caso nel 40%, i lupi tolgono 3 boscaioli, le rocce circa il 3–9%; non misurati nel gioco): scegliendo sempre bene **prima** mediana 201 (10% peggiori 96, 10% migliori 584), **dopo** mediana 390 (10% peggiori 132, 25% migliori sopra 775, 10% migliori sopra 1530, 2% sopra 3600); scegliendo a caso prima mediana 22, dopo 25 (chi sceglie male muore o arriva con pochi boscaioli).
- **Alberi**: da circa 17 a circa 35 per corsa; legna per albero da 12 a 16. Legna raccolta in media, tagliando il 70% degli alberi (scegliendo bene) o il 50% (a caso): **prima 146 / 105, dopo 389 / 278**. Cambiato per fare spazio: `pesoAlberi` 4 → 8, `pesoRocce` 3 → 2, `pesoLupi` 3 → 2 (i lupi e le rocce sono circa un terzo in meno), distanza tra i gruppi 22–30 → 20–26 m, alberi per gruppo 2–3 → 3–4.
- **Orso**: vita 200 al livello 1, +12% a ogni livello (224, 251, 281, 315, …, livello 10 = 555). **Perché 200**: chi sceglie bene arriva con una mediana di 390 (25% dei casi sotto 213): l'orso costa circa 1,1 volte la sua vita (200 colpi + circa 6 zampate da 4 boscaioli = circa 225 boscaioli), quindi chi sceglie bene vince in circa 3 corse su 4 e gli restano in media circa 165 boscaioli (circa il 40%: poche per ×15 o ×20), chi sceglie male perde. Il 12% a livello è una mia scelta: al livello 5 vince circa il 40% di chi sceglie bene. Dopo la sconfitta salta 3–5 corse a caso (si conta ogni corsa iniziata, anche se poi si perde prima di arrivare all'orso).
- **Scalinata**: 20 gradini ×1…×20 (altezza 0,5 m, salita a 8 m/s, prima a 6; prima della salita la squadra arriva di corsa). Costo gradino `2,5 × 1,23^gradino × (1 + peso/600)`. Boscaioli che servono (cumulati, da avere quando si inizia a salire): peso del carro 150 → ×10 = 99, ×15 = 297, ×20 = 849; peso 400 (circa 390 legna di una corsa buona) → 130 / 393 / 1129; peso 800 → 180 / 547 / 1577.
- **Telefono**: limite di omini disegnati lasciato a **120** (`massimoVisibili`, c'era già e il numero sopra la squadra è sempre quello vero); nello scontro al massimo 40 boscaioli disegnati (`visibiliMassimi`), ognuno vale più boscaioli veri. **Verificato con Chrome DevTools** (telefono 390×780, CPU 4 volte più lenta): scontro con 1.000 boscaioli e scalinata ×20 con 1.500 boscaioli a 60 fotogrammi al secondo (mediana 16,7 ms, 95% sotto 16,8 ms; l'unico scatto, circa 150–180 ms, è all'avvio della corsa); nessun errore in console.
- **Decisioni prese da solo**: orso grande 2,8 volte il modello (circa 5 metri di lunghezza e 6 in piedi, il lupo gigante circa 1,6); squadra ferma a 15 metri; i boscaioli tolti dalle zampate sono tolti dal numero vero subito (si vedono volare); quelli partiti all'attacco sono tolti dal numero quando partono; se la vita dell'orso arriva a zero i boscaioli ancora in corsa spariscono senza colpire; l'orso che cade sprofonda nella neve per lasciare passare la squadra; se perdi contro l'orso la carne sul carro è persa e si porta la sola legna; i risultati delle prove (`?orso`) non toccano il salvataggio; la scritta "Boscaioli arrivati" nel riepilogo è quanti erano all'inizio della salita; il ruggito è la parte iniziale di un verso "arrabbiato" lungo (non ascoltato da me, come gli altri suoni).
- **Da controllare nella prova**: orso grande e cattivo? scontro faticoso ma non lungo (5–8 s)? telecamera ferma sull'orso e poi torna sulla squadra? barra e numero dei boscaioli leggibili sul telefono? suoni (ruggito, zampate, colpi, caduta) piacevoli e non fastidiosi? porte rosse comprensibili? legna dagli alberi abbastanza importante? tutorial (prima corsa: niente orso, niente porte rosse, almeno 150 legna) e dopo la prima corsa vinta compare l'orso alla corsa dopo.

### GRUPPO 4, CORREZIONI DOPO LA PRIMA PROVA (2026-10-27, provato e approvato)

Richieste dell'utente: 1) orso più resistente (+50% a tutti i livelli) e zampate più forti, con vittoria di circa 3 su 5 per chi sceglie bene e quasi mai per chi sceglie nella media; 2) ruggito vero (non sintetico); 3) tronchi che escono dal carro; 4) musica paurosa non sentita; 5) grida di battaglia nello scontro. In più una domanda sull'economia (sotto), senza cambiare niente.
- **1) Orso**: `CONFIG.orso.vita` 200 → **300** (+12% a livello: 336, 376, …, livello 5 = 472, livello 10 = 832); `boscaioliPerZampata` 0,018 → **0,03** e nuovo `zampataMinimo` **8** (prima 3): una zampata toglie 9 boscaioli al livello 1, 15 al livello 5, 25 al livello 10. **Probabilità di vittoria** (simulazione di 4.000 corse con il generatore vero e la stessa logica dello scontro; "bene" = sceglie sempre la porta migliore e urta il 10% degli ostacoli; "nella media" = sceglie la migliore 7 volte su 10 e urta il 25%; a caso = 5 su 10 e 40%): **livello 1: bene 57%, media 13%** (a caso 3%); **livello 5: bene 38%, media 6%**; **livello 10: bene 20%, media 3%**. Al livello 1 l'obiettivo "3 su 5" è centrato; ai livelli alti scende per forza (il giocatore non diventa più forte e l'orso sì: se vuoi, abbassa `crescitaVita`, per esempio 0.08: livello 5 = 408 e livello 10 = 600). **Boscaioli che restano** a chi vince al livello 1 (chi sceglie bene): mediana **319**, media 701 (la media è alta per le corse molto fortunate); non sono "pochi" in assoluto perché i boscaioli a fine corsa sono molto variabili (mediana 396, 25% sotto 226, 10% sopra 1.510): per avere pochi superstiti a quasi tutti i vincitori servirebbe un orso molto più forte, che farebbe perdere troppo spesso chi sceglie bene. Lo scontro dura circa 5 secondi quando si vince (più la corsa verso l'orso e il ruggito).
- **2) Ruggito**: il vecchio (439441 "bear_mad.wav") era un verso poco realistico. Ora **orso-ruggito.mp3** è la registrazione di un orso nero vero: Freesound 763026 "Bear Angry Growl", celldroid, CC0, https://freesound.org/people/celldroid/sounds/763026/ (3 secondi tagliati dove il verso è più forte, tono abbassato del 14% e bassi un po' alzati per farlo più profondo, volume alzato). Non l'ho ascoltato. **Alternative CC0** (registrazioni vere di grizzly, caricate da Nivatius): https://freesound.org/people/Nivatius/sounds/519518/ ("YELL Grizzly Bear Vocalizations", 91 secondi di versi, da cui si può tagliare quello che piace) e https://freesound.org/people/Nivatius/sounds/519599/ ("Grizzly Bear growl eating", 54 secondi, ringhi mentre mangia). Per cambiarlo basta sostituire `public/suoni/orso-ruggito.mp3`.
- **3) Tronchi**: la pila usciva dai bordi perché oltre 36 tronchi si **allargava fino a 1,6 volte** (`ingrossamento`) e perché la fila più larga (6 tronchi) era già un po' più larga delle sponde. Ora la pila non si allarga mai (`carro.js`), la fila più larga ha 5 tronchi, i tronchi sono lunghi 1,6 m invece di 1,7 e un po' più avanti (`modelli/carro.js`): resta tutta dentro il carro. Oltre 36 tronchi smette di crescere; il numero vero della legna è scritto come prima. `legnaPerTronco` 4 → 8 (la pila è piena a 288 legna, non più a 144, così con gli alberi raddoppiati si vede crescere più a lungo). Controllato con 3.000 legna sul carro nella corsa e sulla scalinata (screenshot) e nello scontro. Nuovo `&legna=N` per provarlo.
- **4) Musica**: la logica c'era e funziona (provato: parte quando la squadra si ferma, dissolvenza di 2 secondi; alla fine dello scontro, vincendo o perdendo, torna la musica normale con la stessa dissolvenza). **I problemi erano due**: (a) la musica paurosa (342 KB) si scarica solo 2,5 secondi dopo l'apertura del gioco: con `?orso=...`, che avvia subito la corsa, non era ancora pronta e lo scontro cominciava in silenzio; ora si prepara all'inizio di ogni corsa (`suoni.preparaPaura()`); (b) era registrata piano (media -20 dB) e con i volumi del gioco (musica 0,15) restava circa a -37 dB, cioè quasi inudibile sotto gli effetti: ora ha un guadagno di 2,2 (`GUADAGNO_MUSICA` in `suoni.js`, vale anche per il lupo gigante). Resta comunque sotto il ruggito.
- **5) Grida di battaglia**: nuovi suoni CC0 in `public/suoni/`: **carica** (orso-carica, grido di gruppo forte all'inizio dello scontro: Freesound 563011 "People screaming in agony when charging into battle", florianreichelt, https://freesound.org/people/florianreichelt/sounds/563011/), **grida di singoli boscaioli** (3 file da Freesound 866009 "Battle cry scream 04", Simonus18, https://freesound.org/people/Simonus18/sounds/866009/) e **grida di gruppo più piene** (2 file da 563011). Durante lo scontro un grido ogni 1,8–3,2 secondi (`CONFIG.orso.gridaScontro`); con 100 boscaioli o più (`boscaioliGridaFolla`) sono spesso di gruppo (probabilità da 45% a 85% con più boscaioli). Al massimo uno alla volta, con almeno 1,2 secondi di pausa; volumi (circa -34 dB effettivi) più bassi della musica paurosa (circa -30 dB) e del ruggito (circa -21 dB). Non ascoltati: il 563011 ha "agony" nel titolo, quindi può avere urla più disperate che di guerra: se non va, dimmelo.
- **Verifica**: telefono 390×780, CPU 4 volte più lenta, scontro con 1.000 boscaioli e 3.000 legna sul carro: mediana 16,7 ms, 95% sotto 16,8 ms (l'unico scatto, circa 200 ms, è all'avvio della corsa); musica paurosa a regime (guadagno 2,2) e ritorno alla normale a fine scontro; nessun errore in console.

#### Domanda sull'economia (solo stime, niente cambiato)
Stime con il generatore vero (4.000 corse per caso): legna 2 monete, carne 5; gli alberi tagliati sono il 70% (bene) o il 55% (media); i lupi che toccano la squadra lasciano 2 carne (bene 10% dei lupi, media 25%); lupi e rocce non misurati nel gioco. Il bottino in monete è (legna×2 + carne×5) × moltiplicatore della scalinata, più 100 carne × 5 = 500 monete dell'orso (non moltiplicate).

| Caso | PRIMA (7 porte, scalinata ×10, nessun orso) | DOPO, corsa senza orso (4 su 5: dritti alla scalinata ×20) | DOPO, corsa con l'orso livello 1 vinta |
|---|---|---|---|
| Chi sceglie bene (mediana) | circa 2.640 | circa 11.200 | circa 10.600 |
| Nella media (mediana) | circa 1.416 | circa 5.000 | circa 7.200 (ma vince solo l'11%) |
| Corsa fortunata (10% migliori di "bene") | circa 3.840 | circa 16.900 | circa 17.800 |

Se si perde contro l'orso si porta a casa solo la legna (circa 780 monete chi sceglie bene, circa 615 nella media). Media per corsa nel ciclo "4 corse senza orso + orso", tentando finché vince (livello 1): bene circa 9.900, media circa 2.500; al livello 5: bene circa 8.800, media circa 1.900. **Il bottino è quindi circa 4 volte più grande di prima** (legna 2,7 volte di più e scalinata fino a ×20 con costi molto più bassi); la parte che pesa di più è il moltiplicatore.

**Corse per comprare tutto**: tutte le file 4.150 + 820 + 900, pavimento 300, boscaiolo secondario 5.000 = **11.170 monete**. Le vendite nella base sono la vera strozzatura: i clienti arrivano uno ogni 1–2 secondi e valgono circa 10–13 monete al secondo, cioè circa 600–800 al minuto (stima non misurata; aiutante e venditori la alzano poco perché i clienti arrivano a ritmo fisso). PRIMA circa **8–10 corse** (chi sceglie bene: circa 5 corse di bottino, ma servono circa 14 minuti di vendite; nella media circa 8 corse di bottino). DOPO il bottino di una sola corsa basta per quasi tutto (circa 10.000 monete), quindi il limite diventa vendere la merce: circa **14–16 minuti di vendite, cioè circa 8–10 corse** chi sceglie bene e circa **10–12** nella media. In pratica con il Gruppo 4 le monete non mancano più, ma si vendono allo stesso ritmo di prima: se si vuole che servano più corse, le manopole più efficaci sono il moltiplicatore della scalinata (`CONFIG.salita`: `costoBase` e `crescitaCosto`) e la legna per albero.

### GRUPPO 4, SECONDA SERIE DI CORREZIONI (2026-10-27, provato e approvato)

Richieste dell'utente: 1) `crescitaVita` a 0,08; 2) ruggito: tenere quello attuale (il messaggio era tagliato dopo "tieni quello attuale", quindi non ho cambiato niente ai suoni); 3) economia: bottino troppo grande, legna per albero di nuovo 12, scalinata più dura, obiettivo circa 4.000–5.000 monete per una corsa vinta di chi sceglie bene e circa 6–8 corse per comprare tutto, orso ancora al "3 su 5" al livello 1; 4) guadagni offline: si vende solo la legna del boscaiolo secondario.
- **1) Orso**: `crescitaVita` 0,12 → **0,08** (vita 300 al livello 1, 324 al 2, 350 al 3, 408 al 5, 600 al 10). **Probabilità di vittoria** (stessa simulazione di prima, 4.000 corse; zampate invariate: 9 boscaioli al livello 1, 13 al 5, 18 al 10): **livello 1: bene 56%, nella media 13%; livello 5: bene 44%, media 8%; livello 10: bene 29%, media 4%** (prima, con +12%: 38% e 6% al livello 5, 20% e 3% al 10). Al livello 1 resta il "3 su 5" (56%).
- **3) Economia** (`CONFIG.alberi.legnaPerAlbero` 16 → **12**; `CONFIG.salita.costoBase` 2,5 → **14**, `crescitaCosto` 0,23 → **0,20**; il resto invariato: 35 alberi per corsa, 10 coppie di porte, `pesoRiferimento` 600). Costo del gradino = `14 × 1,20^gradino × (1 + peso del carro / 600)`. **Boscaioli che servono (da avere quando si inizia a salire, cioè dopo l'orso)** con un carro di peso 300 (una corsa buona): **×10 = 551, ×15 = 1.522, ×20 = 3.932** (peso 150: 460 / 1.270 / 3.280; peso 500: 670 / 1.850 / 4.800). **Bottino in monete** di una corsa vinta (stessa stima di prima: legna 2 monete, carne 5, bene taglia il 70% degli alberi, media il 55%; più 500 monete di carne dell'orso quando c'è, non moltiplicate):

| Caso | senza orso (4 corse su 5) | con l'orso livello 1 vinto |
|---|---|---|
| Chi sceglie bene (mediana) | circa 4.600 | circa 4.700 |
| Nella media (mediana) | circa 1.400 | circa 2.650 (ma vince solo il 13%) |
| Corsa fortunata (10% migliori di "bene") | circa 8.700 | circa 9.500 |

  Chi sceglie bene arriva a ×10 o più nel 38% delle corse, a ×15 o più nell'11% e a ×20 nel 2% (2,6% dopo l'orso). Perdendo contro l'orso si porta a casa solo la legna (circa 590 monete). Per confronto: prima del Gruppo 4 era circa 2.640 (bene), 1.416 (media), 3.840 (fortunata); con 16 legna per albero e la scalinata di prima era circa 11.200 / 5.000 / 16.900.
  **Corse per comprare tutto** (11.170 monete: file 4.150 + 820 + 900, pavimento 300, boscaiolo secondario 5.000): con questo bottino basta circa 2–3 corse di monete, ma le vendite nella base sono la strozzatura (i clienti valgono circa 600–1.000 monete al minuto senza venditori e fino a 1.500–2.500 con tutti e tre i livelli di venditore, ma l'aiutante porta la legna a circa 11 monete al secondo, quindi in media circa 900–1.100 monete al minuto): con un giro di circa 100 secondi tra corsa e base servono **circa 8–10 corse** per chi sceglie bene e **circa 10–12** per chi sceglie nella media. È una stima mia, non misurata nel gioco: a questo bottino il numero di corse è deciso dalla velocità di vendita, non dal bottino, quindi per scendere a 6–8 corse servirebbe vendere più in fretta (non l'ho cambiato: non era nelle richieste).
- **4) Offline** (`offline.js`). **Prima della modifica**, con 5.000 legna nella catasta e tutti i lavoratori (aiutante, venditore esperto, boscaiolo secondario): **1 ora = 11.124 monete** (vendeva tutte le 5.480 legna: 5.000 + 480 del secondario) e **24 ore = 33.535 monete** (16.520 legna vendute; si fermava solo perché la legna finiva): i venditori vendono circa 11 legna al secondo, cioè circa 24–41 monete al secondo, contro le 0,27 al secondo del secondario. **Dopo**: si vende solo la legna portata dal boscaiolo secondario (40 ogni 5 minuti) e la carne già sul tavolo; la legna della catasta e del banco non si tocca: **1 ora = 974 monete, 24 ore = 23.385 monete** (480 e 11.520 legna vendute, la catasta resta a 5.000). Senza il secondario si vende solo la carne già sul tavolo (20 carne = 100 monete); senza aiutante la legna del secondario resta nella catasta (0 monete).
- **Decisioni prese da solo**: ho scelto `costoBase` 14 e `crescitaCosto` 0,20 provando una griglia di valori (con i valori vicini ×20 usciva al 3–8% e la mediana era 4.000–6.000); la legna che il giocatore ha già sul banco dello sportello LEGNA quando esce non si vende offline (come quella della catasta); nella schermata "Bentornato!" la legna mostrata è sempre quella del secondario, come prima.
- **Da controllare nella prova**: bottino di una corsa buona (circa 4.600 monete, sul riepilogo "Bottino totale" in legna e carne: legna ×2, carne ×5); scalinata: ×20 deve essere rarissimo; offline con `?offline=60` (circa 970 monete, la catasta non cambia).

### GRUPPO 4, SCONTRO PIÙ DINAMICO (2026-10-27, provato e approvato)

Dopo la prova l'utente ha approvato economia, orso e offline ("non cambiare la velocità di vendita: ci penseranno le espansioni") e ha chiesto uno scontro più movimentato e spettacolare, sempre cartoon e leggero.
- **Fatte** (tutte le idee): (1) boscaioli a **semicerchio** attorno all'orso, da più lati (ognuno ha il suo punto sull'arco, `semicerchio` ±1,35 rad, a 2,9–3,6 m dall'orso); circa uno su tre **salta addosso con l'ascia alzata** (`saltatori` 0,35); (2) ogni colpo si vede: ascia che cala, **lampo bianco** (copia dei materiali solo dell'orso, `emissive`), sobbalzo, schegge di neve, ciuffi di pelo (particelle marroni) e scintille; (3) **zampate** ampie con carica visibile (busto che si gira e si piega all'indietro, braccio alzato; ora 0,8 secondi invece di 0,6) e boscaioli colpiti che **volano ad arco, ricadono nella neve con uno sbuffo e restano a terra 0,6 secondi** prima di sparire; (4) **telecamera che trema** a ogni zampata (0,3 m) e schianto (0,7 m), che decade in meno di mezzo secondo (`mondo.scuoti` in `scena.js`), più neve alzata; (5) l'orso **cammina avanti e indietro** (2,2 m/s, qualche metro) e **si gira verso il gruppo più grande** di boscaioli; ogni 4 attacchi **si alza e batte a terra con le due zampe** (**schianto**: colpo doppio, onda di neve = anello bianco che si allarga, tremolio forte); (6) **furia sotto il 30%**: si alza, ruggisce (stesso suono del ruggito), occhi da rosso ad arancio brillante che pulsa, attacchi con tempi × 0,6; (7) **colpo finale al rallentatore** per 0,5 secondi veri (il mondo di gioco va a un quarto di velocità, l'audio no), poi **crollo con tonfo**, neve, scintille e **boscaioli che esultano** (braccia in alto e saltelli, nuova azione `esulta` della squadra); (8) **barra della vita che trema** quando l'orso è colpito.
- **Saltate**: nessuna. Piccole scelte: dopo il colpo i boscaioli "svaniscono" con un rimpicciolimento come prima (non restano in piedi a esultare: esulta la squadra rimasta); l'esultanza è un movimento di braccia e saltelli senza grida nuove (c'è il grido di gruppo già esistente quando l'orso crolla).
- **Probabilità di vittoria invariate**: gli attacchi nuovi (lo schianto fa il doppio di una zampata, la furia accelera) sono compensati da zampate un po' più leggere (`boscaioliPerZampata` 0,025 e `zampataMinimo` 7: 8 boscaioli al livello 1, schianto 16), controllato con la stessa simulazione: **livello 1: bene 56%, nella media 13%; livello 5: 43% e 8%; livello 10: 30% e 5%** (prima 56/13, 44/8, 29/4).
- **Durata**: misurata nel gioco (500 boscaioli, livello 1): dal grido di carica al tonfo **6,3 secondi** (con il rallentatore compreso), più ruggito iniziale di 2,6 e crollo di 2,4.
- **Verifica**: telefono 390×780 con CPU 4 volte più lenta, 1.000 boscaioli e 3.000 legna sul carro: mediana 16,7 ms, 99% sotto 16,8 ms (l'unico scatto, circa 200 ms, è all'avvio della corsa); nessun errore in console. Lo scontro resta leggero perché tutto è disegnato con 7 pezzi per l'orso e al massimo 40 boscaioli in corsa o in volo (un'`InstancedMesh` per pezzo), l'onda è un solo anello e il tremolio è un semplice spostamento della telecamera.
- **Da controllare nella prova**: si vedono bene il semicerchio, i salti e i boscaioli che volano? Il tremolio della telecamera è piacevole (non fastidioso)? Lo schianto e la furia si capiscono? Il rallentatore finale e l'esultanza? Si legge ancora la barra con il numero quando trema?

## GRUPPO 5: GRAFICA DELLA SEGHERIA

17. Edificio della segheria in stile cartoon, come gli altri personaggi:
   - capanno di legno con lo stesso legno delle mura, tetto spiovente coperto di neve e qualche ghiacciolo che pende dal bordo
   - camino che fuma piano
   - finestre con una luce calda e una lanterna accanto alla porta
   - insegna di legno "SEGHERIA" sopra la porta
   - di lato, sotto una tettoia, una grande lama circolare che gira, con un tronco che avanza verso la lama e un po' di segatura che vola

18. La segheria migliora insieme alle mura, con la stessa animazione a onda:
   - mura di legno: capanno semplice
   - mura di pietra: basamento e camino in pietra
   - rinforzo in metallo: angoli e cerniere di ferro con i bulloni, lama più grande e lucida

19. Cambia solo l'aspetto: posizione, porta, sentiero e regole restano uguali. Tutto deve restare leggero sul telefono (pezzi disegnati in un colpo solo, come per le mura).

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
- **Gruppo 3, fatto**: ogni torre ha due aspetti che si combinano liberamente. La parte bassa segue il materiale delle mura (gruppi `materiali` in `modelli/torretta.js`) e cambia quando l'onda del miglioramento delle mura passa sotto la torre (`ondaArrivata` in `mura.js`). La parte alta, l'arco e l'armatura dell'arciere (stoffa, cuoio, metallo) seguono "Potenzia arcieri" (gruppi `arcieri`, `armatura` in `creaLavoratore`). Portata: ogni arciere solo sul suo lato (stesso segno di x della torre), da un angolo all'altro (+3 m oltre), fino a `gittata` metri dalla linea delle mura (`lupoDaColpire` in `torrette.js`).
- **A, pavimento (fatto)**: il parquet è stato tolto; resta solo il "Pavimento in pietra", con il cerchio al centro (x 0, z -3,45, scritta sotto). Per fare posto: il boscaiolo compare a z 0,2 e il cerchio del venditore è a z 2,65. Nei salvataggi vecchi il parquet diventa pietra e le monete tornano in tasca.
- **Fila ECONOMIA in due cerchi (fatto, provato e approvato)**: `CONFIG.file.economia` (aiutante, venditore, venditore svelto, venditore esperto) e `CONFIG.file.caccia` (cacciatore, secondo cacciatore, cacciatore esperto). **Vanno a coppie** (richiesta dell'utente dopo la prima prova; prima andavano ognuno per conto suo ed era sbagliato): tutti e due nascosti finché non c'è il banco del cacciatore (mura di pietra), poi "Aiutante" + "Cacciatore"; un cerchio al passo N si vede solo se anche l'altro ha comprato i passi prima di N, fino a `PASSI_INSIEME` = 2 (dopo: i potenziamenti con tutti e quattro i lavoratori, come prima). Regola in `aggiornaVisibilita` (`segheria.js`). Un cerchio nascosto mentre cambia posto ricompare già nel posto nuovo (`cambiaPosto` in `miglioramenti.js`). Il pavimento aspetta ancora aiutante, venditore e cacciatore (`LAVORATORI_BASE`). Posti: aiutante a sinistra, venditore al centro in basso, cacciatori in alto a destra, quindi non si toccano. Salvataggi vecchi (`cerchi` < 3): le monete del cerchio ECONOMIA tornano in tasca.
- **Scritte dei cerchi**: tolti i titoli DIFESA ed ECONOMIA; sopra (o sotto) il cerchio resta il nome dell'acquisto, dentro l'icona e il prezzo. Il cerchio del pavimento tiene il titolo PAVIMENTO.
- **C, cacciatori (fatto)**: due cacciatori (catena `secondoCacciatore`, 300 monete, nel cerchio dei cacciatori della fila ECONOMIA, insieme al "Venditore" dopo "Aiutante" e "Cacciatore"); il primo difende la metà sinistra ed esce dal cancello di sinistra, il secondo la destra dal cancello di destra; da solo, il primo fa tutti e due i lati dal cancello più vicino. Portano 30 unità di carne (`caricoCacciatore`); con tutte e quattro le torrette raccolgono solo la carne (`cacciatoriCombattono`). Fuori dalle mura girano da un angolo all'altro sempre nello stesso verso finché non vedono l'obiettivo: provato con lupi in 10 punti, nessuno incastrato.
- **Gruppo A, dopo la prova dell'utente (provato e approvato)**: l'utente ha approvato il Gruppo A e le decisioni prese da soli, e tiene 40 pezzi di legna. Poi: il boscaiolo secondario costa **5000 monete** ed è **l'ultimo acquisto**: il suo cerchio compare solo quando tutte le altre file di `CONFIG.file` sono finite e il pavimento è comprato (`aggiornaVisibilita`); posto spostato a x -2,2 (a -2,6 restavano solo 20 cm dal cerchio della catasta; quando compare è l'unico cerchio dei miglioramenti, quindi non tocca altri cerchi). Salvataggi: `cerchi` 4 in `salvataggio.js` restituisce le monete messe nel suo cerchio; chi l'aveva comprato lo tiene. `?tuttocomprato` (`compraTuttoPerProva`): tutto comprato tranne lui, 5000 monete in tasca, tutorial finito, poi sparisce dall'indirizzo. Provato con Chrome DevTools: si vede solo il suo cerchio, un salvataggio vecchio con 200 monete nel cerchio le riporta in tasca, console senza errori.
- **Gruppo B, fatto (da provare)**: `src/motore/suoni.js` con un oggetto `suoni` (`suona(nome, opzioni)`, `imposta(acceso)`, `sblocca()`); ogni suono è una ricetta in `RICETTE` fatta con due mattoncini, `tono` (nota che scivola, con vibrato e filtro) e `rumore` (rumore bianco filtrato), con `pausa` (secondi minimi tra due uguali) e `insieme` (quanti uguali al massimo), più un limite di 14 suoni in tutto e un compressore. Per il Gruppo C (allarme e mura cadute) basta aggiungere due ricette e chiamare `suoni.suona`. L'impostazione dell'audio è salvata in `segheria-assediata-impostazioni`, separata dalla partita: `?reset` (e la futura "Ricomincia" del Gruppo C) non la cancellano. Decisioni prese da soli: le frecce che colpiscono non hanno un suono loro (c'è lo swoosh quando partono, e il suono del lupo che muore); il "boscaiolo perso" suona per rocce e lupi della corsa, non per i boscaioli che restano indietro sui gradini della salita; il suono del boscaiolo secondario parte quando scarica la legna sulla catasta; il pulsante dell'audio sta in alto a sinistra sotto le monete (a destra ci sono legna e carne). Provato con Chrome DevTools: il primo clic sblocca l'audio e partono i suoni (festa del "Bentornato!", frecce, morsi...), il pulsante spegne e riaccende con un clic e resta spento ricaricando, nessun errore nuovo nella console (c'è solo il 404 di `favicon.ico`, che c'era già: il gioco non ha un'icona per la scheda).
- **Gruppo C, da sapere prima di iniziare**: oggi le mura hanno `CONFIG.segheria.hpMura` (legno) e `hpMura` in `CONFIG.miglioramenti.mura` (pietra, metallo); il danno dei morsi è `dannoMura` (e `CONFIG.lupoGigante.dannoMura` come moltiplicatore). Per C2 controllare in `mura.js` e `segheria.js` cosa succede quando la vita arriva a 0 e dirlo all'utente prima di cambiarlo.
- **Gruppo A, fatto**:
  - A1: cartellino (sprite) con la moneta e il numero sopra la pila del cerchio delle monete, a 1,15 m di altezza (`soldi.js`); **quando il cerchio è vuoto sparisce** (scelta presa da soli). Da 10.000 in su il numero è corto ("12,5K", `formatta`).
  - A2: catena `boscaioloSecondario` nella fila `CONFIG.file.secondario`, un terzo cerchio ECONOMIA (prima costava 500 monete e compariva con i potenziamenti, a x -2,6: poi cambiato, vedi la nota qui sopra). `src/segheria/secondario.js`: berretto viola, slitta con la corda, tronchi visibili solo al ritorno; strada `MAPPA.giroSecondario` (catasta → cancello della corsa → lungo le mura a sinistra della segheria → tra gli abeti). Tutto dipende da `mancano` (secondi al ritorno alla catasta): il giro dura esattamente `minutiSecondario`, il ritorno a piedi è dentro il conto. Conto alla rovescia accanto al cancello della corsa (x +3,6, alto 2,4 m): sopra il cancello toccava la barra delle mura. Durante le corse `lavoraDuranteLaCorsa` (chiamato da `main.js`).
  - A3: `src/segheria/offline.js` (`secondiDiAssenza`, `ritmi`, `lavoroOffline`) chiamato da `lavoroMentreVia` in `segheria.js` appena caricato il salvataggio; i risultati stanno in `stato.bentornato` finché non si preme "Raccogli" (`apriBentornato`, `versaMonete`). Decisioni prese da soli: le vendite offline richiedono un venditore (senza, la merce resta dov'è); la carne si vende solo se è già sul tavolo, **i cacciatori offline non portano carne nuova** (servirebbe simulare i lupi: non è semplice); `stato.orologio` non torna mai indietro (al massimo 24 ore avanti) e viene salvato subito dopo il calcolo, così ricaricare non dà monete due volte; sul telefono, tornando nella base dopo 2 minuti con la pagina aperta, la pagina si ricarica per calcolare i guadagni. Numeri: con il boscaiolo secondario circa 975 monete all'ora; senza, 0 all'ora (si vende solo la merce già presente). Provato con `?offline=60`: 12 giri = 480 legna, 1.278 monete (con 100 legna e 20 carne già presenti), ricaricando la pagina non raddoppia, durante il tutorial non compare.
- **Gruppo 5, segheria**: l'edificio è in `src/modelli/segheria.js` (posizione `MAPPA.casa`, fuori dal cancello della corsa). Per l'onda delle mura si può usare `ondaArrivata` in `mura.js`, come per le torri, e per il legno `legnoPali` in `materiali.js`.
- **Gruppo 4, corsa**: la salita finale attuale (`src/corsa/sfidaFinale.js`) andrà sostituita dallo scontro con l'orso.
- **Dopo i gruppi**: Fase 4 (suoni) e Fase 5 (guadagni offline), poi le espansioni di `PIANO-ESPANSIONI.md`.
