// =====================================================================
//  CONFIGURAZIONE DEL GIOCO
//  Qui ci sono TUTTI i numeri che puoi cambiare per regolare il gioco.
//  Cambia un numero, salva il file e il gioco nel browser si ricarica da solo.
//  Le distanze sono in "metri" del mondo 3D (un boscaiolo è alto circa 1 metro).
// =====================================================================

export const CONFIG = {
  // ---------------- PISTA ----------------
  pista: {
    larghezza: 10,          // larghezza della pista su cui corre la squadra (metri)
    lunghezza: 600,         // lunghezza della corsa prima della salita finale (metri)
    inizioOggetti: 35,      // a che distanza dalla partenza compaiono i primi oggetti (metri)
    margineFinale: 25,      // spazio libero prima della salita finale (metri)
  },

  // ---------------- SQUADRA DI BOSCAIOLI ----------------
  squadra: {
    boscaioliIniziali: 8,       // quanti boscaioli partono all'inizio della corsa
    velocitaBase: 13,           // velocità in avanti con il carro vuoto (metri al secondo)
    velocitaLaterale: 14,       // velocità massima a destra/sinistra con il carro vuoto (metri al secondo)
    massimoVisibili: 120,       // quanti omini al massimo vengono disegnati (oltre, aumenta solo il numero)
    dimensioneOmino: 1.3,       // grandezza di ogni boscaiolo (1 = alto circa 1,3 metri)
    distanzaTraOmini: 0.55,     // spazio tra un omino e l'altro nella formazione (metri)
    larghezzaMassimaFolla: 3.3, // la formazione non diventa mai più larga di così: se gli omini sono tanti si allunga all'indietro (metri)
    raggioCollisioneOmino: 0.2, // "ingombro" di ogni omino per gli urti: un po' più piccolo di quello che si vede (metri)
    // Movimento a destra/sinistra nella corsa: dolce ma sempre pronto al dito
    rispostaLaterale: 24,       // quanto in fretta la squadra segue il dito (più alto = più preciso e immediato, più basso = più morbido); 24 = ci mette circa 0,1 secondi
    inclinazioneLaterale: 0.022, // quanto si inclinano nella direzione in cui vanno (radianti per ogni metro al secondo di velocità)
    inclinazioneMassima: 0.3,   // inclinazione massima (radianti, 0.3 = circa 17 gradi)
    ritardoOnda: 0.035,         // secondi di ritardo in più per ogni fila: il gruppo segue il primo come un'onda (0 = tutti rigidi insieme)
    ondaMassima: 0.55,          // di quanto, al massimo, una fila può restare indietro rispetto alla squadra (metri)
  },

  // ---------------- CONTROLLI ----------------
  controlli: {
    sensibilitaDito: 1.4,       // quanto si sposta la squadra trascinando il dito (1 = larghezza schermo = larghezza pista)
    velocitaTastiera: 12,       // velocità dello spostamento con le frecce/A-D (metri al secondo)
  },

  // ---------------- AUDIO ----------------
  audio: {
    volumeEffetti: 0.5,         // volume generale degli effetti (0-1); ogni effetto ha poi il suo, in motore/suoni.js
    volumeMusica: 0.15,         // volume generale della musica (0-1)
    musicaSottoEffetti: 0.4,    // la musica non supera mai questa parte del volume degli effetti (così sta sempre sotto)
    pausaGrida: 3.5,            // secondi minimi tra due grida dei boscaioli nella corsa
    colpiTaglio: 0.2,           // secondi minimi tra due colpi d'ascia sentiti mentre si taglia un albero (tanti boscaioli = colpi più fitti, ma mai sotto questo)
    gridaCorsa: [5, 9],         // ogni quanti secondi (da-a, a caso) i boscaioli gridano mentre corrono
  },

  // ---------------- CARRO E CARICO ----------------
  carro: {
    distanzaDallaSquadra: 0.3,   // spazio tra l'ultimo boscaiolo e la punta del timone del carro (metri)
    larghezzaIniziale: 1.8,      // larghezza del carro vuoto (metri)
    crescitaMassima: 1.0,        // di quanto può ingrandirsi al massimo (1.0 = diventa largo il doppio)
    caricoPerCrescita: 150,      // con questo carico (legna + carne) il carro è cresciuto di circa 2/3 del massimo
    pesoPerLegna: 1,             // quanto pesa ogni unità di legna
    pesoPerCarne: 1.5,           // quanto pesa ogni unità di carne
    forzaPerBoscaiolo: 10,       // quanto peso "regge" ogni boscaiolo senza rallentare troppo
    rallentamentoMassimo: 0.55,  // con un carico enorme la velocità in avanti scende fino a perdere il 55%
    perditaAgilitaMassima: 0.35, // con un carico enorme lo spostamento laterale perde AL MASSIMO il 35% (si riesce sempre a schivare)
    prontezzaCarro: 10,          // quanto velocemente il carro segue la squadra di lato (più alto = più preciso)
    riduzioneCollisione: 0.8,    // gli urti del carro contano solo sull'80% della sua larghezza (perdona i colpi di striscio)
    legnaPerTronco: 4,           // ogni quanta legna compare un tronco in più sulla pila del carro
    tronchiMassimi: 36,          // tronchi disegnati al massimo; oltre, la pila diventa "cataste" più grosse
    carnePerPezzo: 4,            // ogni quanta carne compare un pezzo in più sul carro
    pezziCarneMassimi: 12,       // pezzi di carne disegnati al massimo sul carro
    caricoPersoSuRoccia: 0.2,    // quando il carro urta una roccia perde questa parte del carico (0.2 = 20%)
    caricoPersoSuAlbero: 0.1,    // quando il carro urta un albero in piedi perde questa parte del carico (0.1 = 10%)
  },

  // ---------------- OGGETTI CHE VOLANO SUL CARRO ----------------
  volo: {
    durata: 0.65,            // quanti secondi impiega un tronco (o la carne) a volare fino al carro
    altezzaArco: 4,          // quanto sale l'arco del volo (metri)
    tronchiPerAlbero: 3,     // quanti tronchi volano da ogni albero abbattuto
    intervallo: 0.12,        // pausa tra un tronco e il successivo (secondi)
  },

  // ---------------- PORTE CON I NUMERI ----------------
  porte: {
    numeroCoppie: 7,         // quante coppie di porte ci sono in ogni corsa
    sommaMinima: 4,          // porta "+": numero minimo
    sommaMassima: 20,        // porta "+": numero massimo
    sottrazioneMinima: 3,    // porta "-": numero minimo
    sottrazioneMassima: 12,  // porta "-": numero massimo
    probabilitaX2: 0.25,     // probabilità che la porta buona sia "x2"
    probabilitaX3: 0.07,     // probabilità che la porta buona sia "x3"
    probabilitaDiviso: 0.3,  // probabilità che la porta cattiva sia "÷2" invece di "-"
    probabilitaDueBuone: 0.2,// probabilità che entrambe le porte siano buone (ma diverse)
  },

  // ---------------- ALBERI ----------------
  alberi: {
    resistenza: 14,          // "vita" di un albero: colpi d'ascia necessari per abbatterlo
    forzaAscia: 1,           // colpi d'ascia al secondo di ogni boscaiolo
    tempoMinimoTaglio: 0.25, // anche con tantissimi boscaioli il taglio dura almeno questi secondi
    legnaPerAlbero: 12,      // legna che finisce sul carro per ogni albero abbattuto
    raggio: 0.9,             // ingombro di un albero (metri)
  },

  // ---------------- ROCCE ----------------
  rocce: {
    raggioCollisione: 0.75,  // ingombro della roccia per gli urti (quella disegnata è larga circa 1,1 m di raggio)
    // Ogni omino che tocca davvero la roccia viene eliminato: un colpo di striscio costa pochi omini.
  },

  // ---------------- LUPI ----------------
  lupi: {
    lupiPerBrancoMinimo: 2,      // lupi minimi in un branco
    lupiPerBrancoMassimo: 4,     // lupi massimi in un branco
    boscaioliPerLupo: 3,         // boscaioli eliminati da ogni lupo che combatte con la squadra
    carnePerLupo: 2,             // carne lasciata da ogni lupo sconfitto
    dimensione: 1.5,             // grandezza del lupo disegnato (1 = lungo circa 1,1 metri)
    raggioCollisione: 0.55,      // ingombro di un lupo per gli urti, un po' più piccolo di quello disegnato (metri)
    probabilitaCorrono: 0.5,     // probabilità che il branco corra incontro alla squadra invece di stare fermo
    velocita: 5,                 // velocità dei lupi che corrono incontro (metri al secondo)
    distanzaAttivazione: 40,     // a che distanza dalla squadra i lupi iniziano a correre (metri)
    caricoRubatoDalCarro: 0.1,   // se un lupo raggiunge il carro ruba questa parte del carico (0.1 = 10%)
  },

  // ---------------- GENERAZIONE DEL LIVELLO ----------------
  livello: {
    distanzaMinimaSezioni: 22, // distanza minima tra un gruppo di oggetti e il successivo (metri): tempo per reagire
    distanzaMassimaSezioni: 30,// distanza massima tra un gruppo di oggetti e il successivo (metri)
    pesoAlberi: 4,           // quanto spesso escono file di alberi (più alto = più spesso)
    pesoRocce: 3,            // quanto spesso escono rocce
    pesoLupi: 3,             // quanto spesso escono branchi di lupi
    pesoMisto: 2,            // quanto spesso escono alberi insieme a rocce o lupi
    margineLibero: 0.8,      // spazio in più lasciato nel passaggio libero, oltre alla larghezza di squadra e carro (metri)
    seme: 0,                 // 0 = livello diverso ogni volta; un altro numero = sempre lo stesso livello
  },

  // ---------------- SALITA FINALE ----------------
  salita: {
    moltiplicatori: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // moltiplicatore di ogni gradino, dal basso verso l'alto
    altezzaGradino: 0.7,     // altezza di ogni gradino (metri)
    profonditaGradino: 4.5,  // lunghezza di ogni gradino (metri)
    velocita: 6,             // velocità della squadra in salita (metri al secondo)
    costoBase: 2,            // boscaioli che restano indietro sul primo gradino (stanchi!)
    crescitaCosto: 0.35,     // ogni gradino costa questa parte in più del precedente (0.35 = +35%)
    pesoRiferimento: 150,    // con questo peso sul carro ogni gradino costa il doppio
  },

  // ---------------- TUTORIAL ----------------
  tutorial: {
    legnaPrimaCorsa: 150,        // la prima corsa vinta del tutorial porta a casa almeno questa legna (con un bonus, se serve)
  },

  // ---------------- SEGHERIA (la base) ----------------
  segheria: {
    legnaIniziale: 30,           // legna già nella catasta alla primissima partita (per provare subito a vendere)
    velocitaBoscaiolo: 6,        // velocità del boscaiolo che cammina (metri al secondo)
    dimensioneBoscaiolo: 1.6,    // grandezza del boscaiolo nella segheria
    pezziVisibiliSchiena: 8,     // pezzi disegnati al massimo in ogni colonna sulla schiena (il carico NON ha limiti: sopra c'è il numero vero)
    unitaPerPezzo: 5,            // quante unità di legna (o carne) vale ogni pezzo trasportato
    intervalloRaccolta: 0.1,     // secondi tra un pezzo e l'altro quando raccoglie o scarica
    voliPerTrasferimento: 12,    // una pila grande si sposta in circa questi voli (pezzi più "grossi"), così non serve aspettare minuti
    velocitaAiutante: 3,         // velocità dell'aiutante che porta la legna dalla catasta allo sportello (metri al secondo)
    raggioRaccolta: 1.5,         // quanto vicino alla catasta (o alla pila di soldi) bisogna stare (metri)
    raggioSportello: 1.2,        // quanto vicino al punto di deposito di uno sportello bisogna stare per scaricare (metri)
    tempoCancello: 1.0,          // secondi da passare sul sentiero per partire per una nuova corsa
    raggioJoystick: 55,          // quanto si può spostare il pomello del joystick (pixel)
    pezziMassimiSportello: 24,   // pezzi che si vedono al massimo sulla rastrelliera (legna) o sul tavolo (carne) di uno sportello
    hpMura: 360,                 // punti vita delle mura di legno (con i miglioramenti diventano di più: pietra 800, metallo 1500)
    dannoMura: 1.1,               // danno che un lupo fa alle mura ogni secondo (il lupo gigante invece morde a colpi: vedi lupoGigante)
    // Vita dei lupi in "punti": un lupo normale ne ha 15. L'ascia ne toglie 5 (servono 3 colpi),
    // una freccia quanti ne dice il livello della torretta (3 = 5 frecce, 5 = 3 frecce, 8 = 2 frecce).
    hpLupo: 15,                  // punti di vita di un lupo normale
    dannoAscia: 5,               // punti tolti da un colpo d'ascia (del boscaiolo o del cacciatore) a un lupo normale
    raggioAttaccoLupo: 2.4,      // distanza massima per colpire un lupo con l'ascia
    attaccoCooldown: 0.45,        // secondi tra un colpo e il successivo
    velocitaLupo: 1.2,           // velocità dei lupi intorno alla base
    // I lupi arrivano solo dopo aver comprato le mura di pietra. Da lì arrivano pochi lupi deboli
    // (vedi "lupiDeboli"); ogni torretta comprata apre un lato (prima il sinistro, poi il destro),
    // da cui arrivano lupi normali a gruppi, sempre di più col passare del tempo (i numeri qui sotto
    // valgono per ogni lato, e ogni lato ha il suo orologio che parte quando si compra la torretta).
    primoLupo: 6,                // dopo quanti secondi arriva il primo lupo (di un lato appena aperto, o dei lupi deboli)
    intervalloLupiMinimo: 7,     // secondi minimi tra un gruppo di lupi e il successivo (per lato)
    intervalloLupiMassimo: 11,   // secondi massimi tra un gruppo di lupi e il successivo (per lato)
    lupiInsiemeInizio: 2,        // quanti lupi di un lato ci possono essere insieme quando il lato si apre...
    lupiInsiemeMassimo: 6,       // ...e al massimo, col passare del tempo
    unLupoInPiuOgni: 70,         // ogni quanti secondi un lato può avere un lupo in più insieme
    lupiPerGruppoInizio: 1.6,    // i lupi arrivano a gruppi: all'inizio in media 1,6 per gruppo (1 o 2)...
    lupiPerGruppoFine: 3.2,      // ...e poi in media 3,2 (gruppi di 3 o 4)
    gruppiCresconoIn: 300,       // in quanti secondi (da quando il lato si è aperto) i gruppi passano da piccoli a grandi
    calmaIniziale: 180,          // per questi secondi dopo l'apertura di un lato i suoi lupi sono più lenti e più radi
    velocitaLupiInizio: 0.55,    // all'inizio i lupi camminano a questa parte della loro velocità (0.55 = poco più della metà)
    intervalloLupiInizio: 1.6,   // all'inizio il tempo tra un lupo e l'altro è 1,6 volte più lungo
    // Dopo le mura di pietra, prima delle torrette: pochi lupi deboli e lenti, da tutte le parti,
    // che il boscaiolo batte con l'ascia mentre mette da parte i soldi per le torrette
    lupiDeboli: {
      intervalloMinimo: 13,      // secondi minimi tra un lupo e il successivo
      intervalloMassimo: 19,     // secondi massimi
      insieme: 2,                // quanti ce ne possono essere al massimo insieme
      vita: 10,                  // punti di vita (un lupo normale ne ha 15): bastano 2 colpi d'ascia
      velocita: 0.5,             // camminano a metà della velocità di un lupo normale
    },
    dannoGiocatore: 0.5,          // danno molto basso se il lupo sfiora il boscaiolo
    carneLupoMinima: 1,          // unità di carne lasciate da un lupo normale: da questa...
    carneLupoMassima: 2,         // ...a questa (a caso)
  },

  // ---------------- LUPO GIGANTE ----------------
  // Ogni 2-3 minuti arriva un lupo grande il doppio, con il pelo più scuro e una grande barra della vita sopra la testa.
  // Morde le mura ogni 0,5-0,8 secondi e ogni morso toglie 8 punti, ma in tutto non toglie mai più del 25% della vita massima
  // delle mura (legno 90, pietra 200, metallo 375): poi i suoi morsi non fanno più danno finché non muore.
  // Ha 400 punti di vita: un colpo d'ascia ne toglie 6 (servono 67 colpi), una freccia quanti ne toglie a un lupo
  // normale (3 = 134 frecce; con "Potenzia arcieri" 5 = 80 frecce, con "Potenzia arcieri 2" 8 = 50 frecce).
  // Con il boscaiolo che colpisce con l'ascia (circa 8 punti al secondo, non sempre vicino) e le due torrette del
  // suo lato con "Potenzia arcieri" (circa 8 punti al secondo) servono circa 25 secondi di combattimento.
  // Il primo arriva 2-3 minuti dopo l'acquisto della prima torretta.
  lupoGigante: {
    ogniMinimo: 120,         // secondi minimi tra un lupo gigante e il successivo
    ogniMassimo: 180,        // secondi massimi tra un lupo gigante e il successivo
    vita: 400,               // punti di vita (un lupo normale ne ha 15)
    dannoAscia: 6,           // punti tolti da un colpo d'ascia (del boscaiolo o del cacciatore)
    grandezza: 2,            // quanto è più grande di un lupo normale
    velocita: 1.5,           // va verso le mura a questa parte della velocità di un lupo normale (1,5 = una volta e mezza; prima 0,5)
    intervalloMorso: [0.5, 0.8], // secondi tra un suo morso alle mura e il successivo, a caso tra questi due (prima 1,1-1,7 come i lupi normali)
    dannoMorso: 8,           // punti di vita tolti alle mura da ogni suo morso (prima in media circa 4,6 a morso: 3,3 al secondo)
    limiteDanno: 0.25,       // in tutto il suo attacco, dall'arrivo a quando muore, non toglie mai più di questa parte della vita massima
                             // delle mura (0,25 = 25%, per ogni livello delle mura; il danno dei lupi normali non conta)
    carne: 10,               // unità di carne che lascia quando muore...
    pezziCarne: 5,           // ...divise in questi pezzi sparsi a terra
    tempoAvviso: 2.6,        // secondi in cui resta la scritta "Arriva il lupo gigante!"
    ululato: 2.6,            // secondi in cui, appena arrivato, si ferma a ululare con la testa al cielo
    sostaTelecamera: 2.6,    // secondi in cui la telecamera lo guarda quando arriva (poi torna sul boscaiolo)
    zoomTelecamera: 0.85,    // quanto è vicina la telecamera quando lo guarda (più basso = più vicina)
  },

  // ---------------- MURA CHE CEDONO ----------------
  // Sotto questa parte di vita compare l'avviso "Le mura stanno cedendo! Riparale!" (al massimo una volta ogni tot secondi).
  // A zero vita le mura cadono: la partita è persa e compare "Le mura sono cadute!" con il pulsante "Ricomincia".
  muraAllarme: {
    sotto: 0.25,             // sotto il 25% della vita delle mura
    ogniSecondi: 30,         // al massimo un avviso ogni 30 secondi
    tempoAvviso: 3,          // secondi in cui resta la scritta
    // Alla stessa soglia compare al centro della base il grande cerchio verde per riparare le mura con la legna:
    // il boscaiolo ci porta questa quantità di legna (prima la riparazione si comprava solo con le monete: 100 monete
    // = 50 legna, perché la legna vale 2 monete l'una) e le mura tornano alla vita massima. Resta finché le mura non sono riparate.
    legnaRiparazione: 50,
    raggioCerchio: 3,        // grandezza del cerchio verde (un cerchio normale è 1,2): è il più grande della base
    durataTelecamera: 2,     // secondi in cui la telecamera guarda il cerchio quando compare (poi torna sul boscaiolo; se il cerchio si vede già bene non si muove)
  },

  // ---------------- CLIENTI ----------------
  clienti: {
    intervalloMinimo: 1.2,       // secondi minimi tra l'arrivo di un cliente e il successivo
    intervalloMassimo: 2.2,      // secondi massimi tra l'arrivo di un cliente e il successivo
    filaPerSportello: 5,         // quanti clienti al massimo aspettano in fila davanti allo sportello LEGNA
    filaCarne: 3,                // quanti clienti al massimo aspettano in fila davanti allo sportello CARNE
    velocita: 2.8,               // velocità dei clienti che camminano (metri al secondo)
    acquistoMinimo: 5,           // unità minime che compra un cliente
    acquistoMassimo: 15,         // unità massime che compra un cliente
    tempoAcquisto: 0.7,          // secondi che il cliente aspetta allo sportello prima di iniziare a comprare
    intervalloPezzi: 0.3,        // secondi tra un pezzo e l'altro che il cliente prende dal bancone
    probabilitaCarne: 0.2,       // probabilità che un cliente voglia carne invece di legna (la carne ha meno clienti)
    // Inizio più veloce: finché non si comprano le mura di pietra i clienti arrivano più spesso, comprano
    // di più e più in fretta: tornando dalla prima corsa con la fila vuota, si incassano circa 250 monete
    // nei primi 30 secondi (al ritmo normale circa 240, provato). Dopo l'acquisto tornano piano piano al
    // ritmo normale, in "ritornoIn" secondi.
    avvio: {
      intervalloMinimo: 1.1,     // secondi minimi tra un cliente e il successivo (normale 1,2)
      intervalloMassimo: 1.9,    // secondi massimi (normale 2,2)
      acquistoMinimo: 6,         // unità minime che compra un cliente (normale 5)
      acquistoMassimo: 15,       // unità massime
      rapidita: 1.1,             // aspettano e prendono i pezzi un po' più in fretta
      ritornoIn: 90,             // secondi per tornare al ritmo normale dopo l'acquisto
    },
  },

  // ---------------- MIGLIORAMENTI DELLA BASE ----------------
  // Le "catene" qui sotto dicono cosa fa ogni livello. I cerchi a terra però seguono le "file"
  // (vedi "file" più giù): DIFESA (un cerchio) ed ECONOMIA (due cerchi); ogni cerchio mostra solo il suo
  // prossimo acquisto, nell'ordine scritto lì. Il pavimento ha il suo cerchio.
  miglioramenti: {
    // --- Difesa ---
    mura: [
      { nome: 'Mura di pietra', prezzo: 250, icona: 'pietra', hpMura: 800 },       // rocce appuntite alla base, verso fuori
      { nome: 'Rinforzo in metallo', prezzo: 600, icona: 'metallo', hpMura: 1500 }, // assi di ferro con i bulloni tra i pali
    ],
    riparazione: [ // le mura recuperano vita da sole, lentamente (vita al secondo)
      { nome: 'Riparazione', prezzo: 100, icona: 'martello', vitaAlSecondo: 0.8 },
      { nome: 'Riparazione veloce', prezzo: 200, icona: 'martello', vitaAlSecondo: 1.6 },
      { nome: 'Riparazione esperta', prezzo: 400, icona: 'martello', vitaAlSecondo: 3.2 },
    ],
    // Torri di legno sulle mura con un arciere che tira frecce ai lupi: due torri per lato (quattro in tutto),
    // poi "Potenzia arcieri" per tutte. torri = quante torri ci sono (nell'ordine di MAPPA.torri).
    // danno = punti di vita tolti da ogni freccia (un lupo normale ne ha 15); ricarica = secondi tra una freccia e l'altra;
    // gittata = fin dove tira, in metri dalla linea delle mura del SUO lato (dentro e fuori); ogni arciere copre
    // tutto il suo lato da un angolo all'altro, ma mai l'altra metà della base (il centro è a 11,2 metri dalle mura);
    // aspetto = arcieri, archi, frecce e parte alta delle torri (0 stoffa, 1 cuoio e scudi blu, 2 metallo e oro);
    // la parte bassa delle torri invece segue il materiale delle mura (legno, pietra, metallo)
    torretta: [
      { nome: 'Torretta sinistra 1', prezzo: 150, icona: 'torre', torri: 1, ricarica: 1.6, gittata: 8, danno: 3, aspetto: 0 }, // 5 frecce per lupo
      { nome: 'Torretta destra 1', prezzo: 150, icona: 'torre', torri: 2, ricarica: 1.6, gittata: 8, danno: 3, aspetto: 0 },
      { nome: 'Torretta sinistra 2', prezzo: 250, icona: 'torre', torri: 3, ricarica: 1.6, gittata: 8, danno: 3, aspetto: 0 },
      { nome: 'Torretta destra 2', prezzo: 250, icona: 'torre', torri: 4, ricarica: 1.6, gittata: 8, danno: 3, aspetto: 0 },
      { nome: 'Potenzia arcieri', prezzo: 600, icona: 'arco', torri: 4, ricarica: 1.2, gittata: 9, danno: 5, aspetto: 1 },     // 3 frecce per lupo
      { nome: 'Potenzia arcieri 2', prezzo: 1200, icona: 'arcoOro', torri: 4, ricarica: 0.8, gittata: 10, danno: 8, aspetto: 2 }, // 2 frecce per lupo
    ],
    // --- Lavoratori ---
    aiutante: [
      { nome: 'Aiutante', prezzo: 120, icona: 'ascia' }, // porta da solo la legna dalla catasta allo sportello
    ],
    // i cacciatori combattono i lupi (finché non ci sono tutte e quattro le torrette) e portano la carne allo sportello CARNE:
    // il primo esce dal cancello di sinistra, il secondo da quello di destra; "Cacciatore esperto" vale per tutti e due
    cacciatore: [
      { nome: 'Cacciatore', prezzo: 200, icona: 'cacciatore', ricarica: 0.9, velocita: 3.2 },          // ricarica = secondi tra un colpo e l'altro
      { nome: 'Cacciatore esperto', prezzo: 400, icona: 'cacciatore', ricarica: 0.5, velocita: 4.2 },
    ],
    secondoCacciatore: [ // lavora allo stesso banco del primo e difende il lato destro
      { nome: 'Secondo cacciatore', prezzo: 300, icona: 'cacciatore' },
    ],
    venditore: [ // un venditore dietro ogni sportello passa la merce ai clienti: vengono serviti (e arrivano) più in fretta
      { nome: 'Venditore', prezzo: 100, icona: 'venditore', rapidita: 1.6 },        // 1.6 = una volta e mezza più veloce
      { nome: 'Venditore svelto', prezzo: 200, icona: 'venditore', rapidita: 2.2 },
      { nome: 'Venditore esperto', prezzo: 400, icona: 'venditore', rapidita: 3 },
    ],
    // fa le corse da solo e porta la legna alla catasta (quanta e ogni quanto: vedi "lavoratori" più giù);
    // è l'ultimo acquisto: il suo cerchio compare solo quando è stato comprato tutto il resto
    boscaioloSecondario: [
      { nome: 'Boscaiolo secondario', prezzo: 5000, icona: 'secondario' },
    ],
    // --- Pavimento della base (solo aspetto) ---
    pavimentoPietra: [
      { nome: 'Pavimento in pietra', etichetta: 'Pietra', prezzo: 300, icona: 'pavimento' }, // etichetta: scritta sopra il cerchio
    ],
    tempoPagamento: 1.5,     // secondi per pagare un livello intero stando sul cerchio (le monete volano dentro)
  },

  // ---------------- LE FILE DI CERCHI ----------------
  // Ogni fila è un solo cerchio a terra che mostra il prossimo acquisto: [catena, livello] (il livello parte da 0).
  // Comprato un passo, nello stesso cerchio compare il successivo. La fila ECONOMIA ha due cerchi, "economia"
  // (aiutante e venditore) e "caccia" (i due cacciatori), che compaiono insieme con le mura di pietra e vanno
  // avanti a coppie: prima Aiutante e Cacciatore, comprati tutti e due Venditore e Secondo cacciatore, poi i
  // potenziamenti (quando sono stati assunti tutti e quattro). Vedi aggiornaVisibilita in segheria.js.
  // Il cerchio "secondario" (anche lui della fila ECONOMIA) è l'ultimo: compare solo quando sono finite tutte le
  // altre file (DIFESA ed ECONOMIA, potenziamenti compresi) ed è stato comprato il pavimento.
  // Il pavimento compare (con il suo cerchio) solo quando sono stati assunti aiutante, venditore e cacciatore.
  file: {
    difesa: [
      ['mura', 0],        // Mura di pietra (è il passaggio del tutorial)
      ['torretta', 0],    // Torretta sinistra 1
      ['torretta', 1],    // Torretta destra 1
      ['torretta', 2],    // Torretta sinistra 2
      ['torretta', 3],    // Torretta destra 2
      ['riparazione', 0], // Riparazione 1
      ['mura', 1],        // Rinforzo in metallo
      ['riparazione', 1], // Riparazione 2
      ['torretta', 4],    // Potenzia arcieri 1
      ['torretta', 5],    // Potenzia arcieri 2
      ['riparazione', 2], // Riparazione 3
    ],
    economia: [
      ['aiutante', 0],    // Aiutante
      ['venditore', 0],   // Venditore
      ['venditore', 1],   // Venditore svelto
      ['venditore', 2],   // Venditore esperto
    ],
    caccia: [
      ['cacciatore', 0],  // Cacciatore (il suo banco compare già dopo le mura di pietra)
      ['secondoCacciatore', 0], // Secondo cacciatore
      ['cacciatore', 1],  // Cacciatore esperto
    ],
    secondario: [
      ['boscaioloSecondario', 0], // Boscaiolo secondario
    ],
  },

  // ---------------- IMPRONTE NELLA NEVE ----------------
  impronte: {
    massimo: 160,            // impronte visibili al massimo insieme (le più vecchie spariscono prima)
    durata: 5,               // secondi prima che un'impronta sparisca del tutto...
    sbiadisce: 2.5,          // ...e negli ultimi secondi (questi) sbiadisce piano piano
  },

  // ---------------- LAVORATORI E TORRETTE ----------------
  lavoratori: {
    velocitaFreccia: 16,     // velocità delle frecce degli arcieri (metri al secondo)
    raggioColpoCacciatore: 1.2, // da quanto vicino il cacciatore colpisce un lupo (metri)
    caricoMassimo: 20,       // unità di legna che l'aiutante porta al massimo a ogni viaggio
    caricoCacciatore: 30,    // unità di carne che ogni cacciatore porta al massimo a ogni viaggio
    // Boscaiolo secondario: ogni "minutiSecondario" minuti torna dalla foresta con "legnaSecondario" unità di legna
    // (anche durante le corse e quando il gioco è chiuso). Con 40 unità ogni 5 minuti, vendute tutte,
    // fanno circa 960 monete all'ora.
    minutiSecondario: 5,
    legnaSecondario: 40,
    velocitaSecondario: 3.2, // metri al secondo, mentre va e torna dalla foresta con la slitta
  },

  // ---------------- GUADAGNI MENTRE SI È VIA ----------------
  // Quando si riapre il gioco, la base ha continuato a lavorare: il boscaiolo secondario ha portato la legna
  // e aiutante e venditori l'hanno venduta (non più in fretta di come succede giocando). I lupi non fanno danni.
  offline: {
    minimoMinuti: 2,         // sotto questi minuti di assenza non succede niente
    massimoOre: 24,          // oltre queste ore non succede più niente (né legna né vendite)
    passo: 10,               // il calcolo va avanti a passi di questi secondi
  },

  // ---------------- TELECAMERA SUI MIGLIORAMENTI ----------------
  // Quando si compra qualcosa che compare lontano (o fuori dallo schermo) la telecamera va a vederlo
  regia: {
    viaggio: 1.0,            // secondi per arrivare sul punto (poi parte l'animazione della costruzione)
    sosta: 1.8,              // secondi fermi a guardare la costruzione
    ritorno: 1.2,            // secondi per tornare sul boscaiolo
  },

  // ---------------- ECONOMIA ----------------
  economia: {
    prezzoLegna: 2,              // monete per ogni unità di legna venduta
    prezzoCarne: 5,              // monete per ogni unità di carne venduta
    probabilitaMancia: 0.15,     // con i venditori, probabilità che un cliente lasci una mancia (0.15 = 15%)
    manciaMinima: 1,             // monete della mancia: da questa...
    manciaMassima: 3,            // ...a questa (a caso)
    soldiPerMoneta: 5,           // nel cerchio delle monete: ogni quante monete guadagnate se ne vede una in più nella pila
    moneteMassime: 60,           // monete disegnate al massimo nella pila
  },

  // ---------------- TELECAMERA DELLA SEGHERIA ----------------
  telecameraSegheria: {
    altezza: 15,             // quanto sta in alto la telecamera (metri)
    distanzaDietro: 10,      // quanto sta dietro al boscaiolo (metri)
    angoloTelefono: 58,      // ampiezza della visuale con lo schermo in verticale (gradi)
    angoloComputer: 45,      // ampiezza della visuale con lo schermo orizzontale (gradi)
  },

  // ---------------- TELECAMERA ----------------
  telecamera: {
    altezza: 15,             // quanto sta in alto la telecamera (metri)
    distanzaDietro: 14,      // quanto sta dietro alla squadra (metri)
    guardaAvanti: 8,         // quanto più avanti della squadra guarda (metri)
    angoloTelefono: 62,      // ampiezza della visuale con lo schermo in verticale (gradi)
    angoloComputer: 50,      // ampiezza della visuale con lo schermo orizzontale (gradi)
    allontanamentoCarro: 0.35, // quanto si allontana la telecamera quando il carro cresce (0 = mai)
  },
};
