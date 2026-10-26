# Piano dei gruppi di modifiche (prima delle Fasi 4 e 5)

> **Stato:** i Gruppi 1 e 2 (con le loro correzioni) sono fatti e salvati (Gruppo 2: commit f279bf9).
> Il Gruppo 3 è **fatto, provato dall'utente e salvato** (2026-10-25, commit f0f1279), insieme a tre richieste in più
> (A pavimento solo in pietra al centro, B nuovo Gruppo 5 scritto qui sotto, C due cacciatori).
> Fatto anche il **nuovo ordine della fila ECONOMIA** (2026-10-25, corretto dopo la prima prova dell'utente), **provato
> e approvato dall'utente e salvato** (commit b32a24b): due cerchi che vanno avanti a coppie, prima "Aiutante" + "Cacciatore", poi
> "Venditore" + "Secondo cacciatore", poi i potenziamenti; tolte le scritte DIFESA ed ECONOMIA (vedi le decisioni qui sotto).
> **Adesso si fanno i Gruppi A, B e C** (scritti qui sotto), uno alla volta, in quest'ordine. Il **Gruppo A è fatto,
> provato e approvato dall'utente e salvato** (2026-10-25, commit 363bb2c), con la modifica chiesta dopo la prova (boscaiolo
> secondario a 5000 monete come ultimo acquisto, `?tuttocomprato`), anche lei provata e approvata.
> **Gruppo B (suoni veri, musica, impostazioni, grida, movimento, colpi d'ascia): fatto, provato e approvato dall'utente e salvato (2026-10-26, commit 1ffc4ab).** Prossimo: Gruppo C.
> Il **Gruppo B (suoni)** è stato provato dall'utente e **va rifatto** (2026-10-25): i suoni fatti dal codice sono
> fastidiosi e vanno sostituiti con **file audio veri CC0**, più la musica (vedi "GRUPPO B, SECONDA VERSIONE" qui sotto).
> La prima versione NON va committata. Il pulsante dell'audio si tiene. Poi il Gruppo C (lupi, mura e lupo gigante).
> I Gruppi 4 e 5 sono **rimandati a più avanti** (dopo A, B e C).

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

## GRUPPO C: LUPI, MURA E LUPO GIGANTE (dopo il Gruppo B; per ora solo scritto qui, non iniziato)

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

Stesse regole degli altri gruppi: verifica veloce, README e PIANO-GRUPPI.md aggiornati, niente commit prima della prova dell'utente, fermarsi se la sessione sta per finire. Finito il gruppo, fermarsi e dire cosa è cambiato e cosa controllare.

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

15. Riporta la corsa alla lunghezza originale, ma tieni le due porte che sono state aggiunte.

16. Boss di fine corsa: alla fine della corsa c'è un ORSO GIGANTE.
   - I boscaioli lo affrontano tutti insieme: ogni boscaiolo gli toglie vita, e se i boscaioli finiscono prima che l'orso sia sconfitto la corsa è persa.
   - Si vede la barra della vita dell'orso e il numero dei boscaioli che diminuisce durante lo scontro.
   - Ogni volta che viene sconfitto, l'orso della corsa successiva diventa più forte (più vita), quindi servono sempre più boscaioli: il giocatore deve scegliere le porte migliori.
   - Quando l'orso viene sconfitto, il bottino del carro viene portato alla base, con un piccolo bonus.
   - Mostra il livello dell'orso (es. "Orso livello 3") prima dello scontro.
   - Il livello raggiunto dall'orso resta salvato.
   - L'orso è in stile cartoon come gli altri personaggi della Fase 3, grande e minaccioso ma simpatico.

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
