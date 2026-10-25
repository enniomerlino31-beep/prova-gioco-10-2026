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
  },

  // ---------------- CONTROLLI ----------------
  controlli: {
    sensibilitaDito: 1.4,       // quanto si sposta la squadra trascinando il dito (1 = larghezza schermo = larghezza pista)
    velocitaTastiera: 12,       // velocità dello spostamento con le frecce/A-D (metri al secondo)
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
    hpMura: 180,                 // punti vita delle mura di legno (con i miglioramenti diventano di più)
    dannoMura: 2.2,               // danno che un lupo fa a una muraglia ogni secondo (più rilassato)
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
  // Ogni 2-3 minuti arriva un lupo grande il doppio, con il pelo più scuro e una barra della vita grande.
  // Ha 60 punti di vita: un colpo d'ascia ne toglie 6 (servono 10 colpi), una freccia quanti ne toglie a un
  // lupo normale (3 = 20 frecce; con "Potenzia arcieri" 5 = 12 frecce, con "Potenzia arcieri 2" 8 = 8 frecce).
  // Il primo arriva 2-3 minuti dopo l'acquisto della prima torretta.
  lupoGigante: {
    ogniMinimo: 120,         // secondi minimi tra un lupo gigante e il successivo
    ogniMassimo: 180,        // secondi massimi tra un lupo gigante e il successivo
    vita: 60,                // punti di vita
    dannoAscia: 6,           // punti tolti da un colpo d'ascia (del boscaiolo o del cacciatore)
    grandezza: 2,            // quanto è più grande di un lupo normale
    velocita: 0.5,           // cammina a questa parte della velocità di un lupo normale (è lento)
    dannoMura: 3,            // fa questo numero di volte il danno alle mura di un lupo normale
    carne: 10,               // unità di carne che lascia quando muore...
    pezziCarne: 5,           // ...divise in questi pezzi sparsi a terra
    tempoAvviso: 2,          // secondi in cui resta la scritta "Arriva il lupo gigante!"
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
  // Le "catene" qui sotto dicono cosa fa ogni livello. I cerchi a terra però sono solo due "file"
  // (vedi "file" più giù): DIFESA ed ECONOMIA, sempre visibili insieme; ogni fila mostra solo il suo
  // prossimo acquisto, nell'ordine scritto lì. Il pavimento ha il suo cerchio.
  miglioramenti: {
    // --- Difesa ---
    mura: [
      { nome: 'Mura di pietra', prezzo: 250, icona: 'pietra', hpMura: 400 },       // rocce appuntite alla base, verso fuori
      { nome: 'Rinforzo in metallo', prezzo: 600, icona: 'metallo', hpMura: 750 }, // assi di ferro con i bulloni tra i pali
    ],
    riparazione: [ // le mura recuperano vita da sole, lentamente (vita al secondo)
      { nome: 'Riparazione', prezzo: 100, icona: 'martello', vitaAlSecondo: 0.4 },
      { nome: 'Riparazione veloce', prezzo: 200, icona: 'martello', vitaAlSecondo: 0.8 },
      { nome: 'Riparazione esperta', prezzo: 400, icona: 'martello', vitaAlSecondo: 1.6 },
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
    // --- Pavimento della base (solo aspetto) ---
    pavimentoPietra: [
      { nome: 'Pavimento in pietra', etichetta: 'Pietra', prezzo: 300, icona: 'pavimento' }, // etichetta: scritta sopra il cerchio
    ],
    tempoPagamento: 1.5,     // secondi per pagare un livello intero stando sul cerchio (le monete volano dentro)
  },

  // ---------------- LE DUE FILE DI CERCHI ----------------
  // Ogni fila è un solo cerchio a terra che mostra il prossimo acquisto: [catena, livello] (il livello parte da 0).
  // Comprato un passo, nello stesso cerchio compare il successivo. Il pavimento compare (come terzo
  // cerchio) solo quando sono stati assunti tutti i lavoratori base: aiutante, venditore e cacciatore.
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
      ['cacciatore', 0],  // Cacciatore (il suo banco compare già dopo le mura di pietra)
      ['secondoCacciatore', 0], // Secondo cacciatore
      ['venditore', 1],   // Venditore svelto
      ['cacciatore', 1],  // Cacciatore esperto
      ['venditore', 2],   // Venditore esperto
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
