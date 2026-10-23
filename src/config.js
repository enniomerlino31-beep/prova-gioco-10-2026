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
    carnePerLupo: 6,             // carne lasciata da ogni lupo sconfitto
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

  // ---------------- SEGHERIA (la base) ----------------
  segheria: {
    legnaIniziale: 30,           // legna già nella catasta alla primissima partita (per provare subito a vendere)
    velocitaBoscaiolo: 6,        // velocità del boscaiolo che cammina (metri al secondo)
    dimensioneBoscaiolo: 1.6,    // grandezza del boscaiolo nella segheria
    capacitaSchiena: 8,          // quanti pezzi (tronchi o carne) può portare sulla schiena al massimo
    unitaPerPezzo: 5,            // quante unità di legna (o carne) vale ogni pezzo trasportato
    intervalloRaccolta: 0.1,     // secondi tra un pezzo e l'altro quando raccoglie o scarica
    raggioRaccolta: 1.5,         // quanto vicino alla catasta (o alla pila di soldi) bisogna stare (metri)
    raggioTavolino: 2.0,         // quanto vicino al tavolino bisogna stare per scaricare (metri)
    tempoCancello: 1.0,          // secondi da passare sul sentiero per partire per una nuova corsa
    raggioJoystick: 55,          // quanto si può spostare il pomello del joystick (pixel)
    pezziMassimiTavolino: 12,    // pezzi di legna (e di carne) che si vedono al massimo sul tavolino
    hpMura: 120,                 // punti vita iniziali delle palafitte di legno
    dannoMura: 2.2,               // danno che un lupo fa a una muraglia ogni secondo (più rilassato)
    hpLupo: 3,                   // colpi d'ascia necessari per abbattere un lupo
    raggioAttaccoLupo: 2.4,      // distanza massima per colpire un lupo con l'ascia
    attaccoCooldown: 0.45,        // secondi tra un colpo e il successivo
    velocitaLupo: 1.2,           // velocità dei lupi intorno alla base
    dannoGiocatore: 0.5,          // danno molto basso se il lupo sfiora il boscaiolo
  },

  // ---------------- CLIENTI ----------------
  clienti: {
    intervalloMinimo: 3,         // secondi minimi tra l'arrivo di un cliente e il successivo
    intervalloMassimo: 6,        // secondi massimi tra l'arrivo di un cliente e il successivo
    filaMassima: 4,              // quanti clienti al massimo aspettano in fila
    velocita: 2.8,               // velocità dei clienti che camminano (metri al secondo)
    acquistoMinimo: 5,           // unità minime che compra un cliente
    acquistoMassimo: 15,         // unità massime che compra un cliente
    tempoAcquisto: 0.7,          // secondi che il cliente passa al tavolino prima di comprare
    probabilitaCarne: 0.35,      // probabilità che un cliente voglia carne invece di legna
  },

  // ---------------- ECONOMIA ----------------
  economia: {
    prezzoLegna: 2,              // dollari per ogni unità di legna venduta
    prezzoCarne: 5,              // dollari per ogni unità di carne venduta
    soldiPerMazzetta: 10,        // ogni quanti dollari compare una mazzetta in più nella pila a terra
    mazzetteMassime: 40,         // mazzette disegnate al massimo nella pila
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
