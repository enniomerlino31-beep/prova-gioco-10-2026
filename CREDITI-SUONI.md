# Crediti dei suoni

Non ci sono suoni delle frecce (tolti su richiesta). Tutti i suoni e le musiche del gioco hanno licenza **CC0** (pubblico dominio: si possono usare anche in un gioco da vendere, senza obbligo di citare l'autore). Li citiamo comunque per riconoscenza.
I file in `public/suoni/` sono stati tagliati, con il volume pareggiato e compressi in mp3 (effetti mono a 96 kbps, musiche stereo), senza filtri che tolgano gli acuti. In tutto pesano circa 2,1 MB (91 file).

## Fonti

**Kenney** (https://kenney.nl, licenza CC0), quattro pacchetti:
- *Impact Sounds*: passi, colpi di legno, pietra, metallo e morbidi;
- *RPG Audio*: monete, cuoio, porte, stoffa, cinghie, cigolii;
- *Casino Audio*: fiches (vendita, mancia, pagamenti);
- *Music Jingles* (Pizzicato e Steel): jingle brevi.

**Freesound** (https://freesound.org, solo file CC0), anche la musica e le grida:
| Uso | Autore | Numero del suono |
|---|---|---|
| Ululato del lupo gigante | betchkal | 500646 |
| Lupo che muore (guaito) | kyles | 452202 |
| Slitta del boscaiolo secondario | kyles | 450847 |
| Passi di gruppo sulla neve (corsa) | AudioPapkin | 712022 |
| Carro | SoundsLikeYukon | 721122 |
| Musica (unica, per tutto il gioco) "A Ukulele Tune" | shaunhillyard | 830500 |
| Ruggito dell'orso gigante (registrazione di un orso nero vero, 3 secondi presi da "Bear Angry Growl", tono abbassato del 14% e bassi un po' alzati) | celldroid | 763026 |
| Grida di battaglia di gruppo (carica e grida piene) "People screaming in agony when charging into battle" | florianreichelt | 563011 |
| Grida di battaglia di singoli boscaioli "Battle cry scream 04" | Simonus18 | 866009 |
| Musica inquietante del lupo gigante "Action music loop with dark ambient drones" | burning-mir | 155139 |
| Grido "Men Shouting Hey" | Jace | 57204 |
| Grido "3 Men Cheering" | jbeetle | 274510 |
| Grido "Male voice Yeah" | deleted_user_5205523 | 340363 |
| Grido "~Yeah!" | bogenseeberg | 475444 |
| Grido "woohoo" | unfa | 468898 |
| Grido "MaleVoiceWoohoo" | melisandepope | 557125 |

| Sega a mano sul legno (cantieri) "sawing of wood sound effect.wav", vecchia sega di metallo che taglia un pezzo di legno | greggace | 118031 |

(pagina del suono: `https://freesound.org/s/<numero>/`)

## Elenco dei file

| File in `public/suoni/` | Che suono è | Fonte |
|---|---|---|
| passo-neve-1…4 | passi del boscaiolo sulla neve | Kenney Impact: footstep_snow_000-003 |
| passo-pietra-1…4 | passi sul pavimento in pietra | Kenney Impact: footstep_concrete_000-003 |
| ascia-1, ascia-2 | colpo d'ascia sul lupo | Kenney Impact: impactPunch_medium_000-001 |
| lupo-muore | lupo che muore | Freesound 452202 + Kenney Impact: impactSoft_heavy_000 |
| morso-1…3 | morso alle mura | Kenney Impact: impactWood_light_000-002 |
| morso-gigante | morso del lupo gigante | Kenney Impact: impactWood_heavy_002 |
| ululato | arrivo del lupo gigante | Freesound 500646 |
| monete-1, monete-2 | monete raccolte | Kenney RPG: handleCoins, handleCoins2 |
| vendita | vendita allo sportello | Kenney Casino: chips-stack-1 |
| mancia | mancia | Kenney Casino: chip-lay-1 |
| pagamento-1…3 | pagamento in un cerchio | Kenney Casino: chips-collide-1…3 |
| acquisto | acquisto completato | Kenney Jingles Pizzicato: PIZZI08 |
| legna-schiena, legna-deposito | legna sulla schiena / sullo sportello | Kenney Impact: impactPlank_medium_000-001 |
| carne-schiena, carne-deposito | carne sulla schiena / sullo sportello | Kenney RPG: handleSmallLeather, dropLeather |
| cancello-apre, cancello-chiude | "toc" sordo e morbido del cancello | Kenney Impact: impactWood_heavy_003-004 (accorciati e più bassi) |
| slitta | slitta sulla neve (boscaiolo secondario) | Freesound 450847 |
| tronchi-catasta | tronchi scaricati sulla catasta | Kenney Impact: impactWood_heavy_000, medium_003, medium_004 |
| costruisci-legno-1…3 | mura e torrette di legno | Kenney Impact: impactWood_medium_000-002 |
| costruisci-pietra-1…3 | mura e torrette di pietra | Kenney Impact: impactMining_000-002 |
| costruisci-metallo-1…3 | rinforzo in metallo | Kenney Impact: impactMetal_medium_000-002 + Kenney RPG: metalClick |
| armatura | potenziamento degli arcieri | Kenney RPG: clothBelt, metalLatch, beltHandle1 |
| lastra-1, lastra-2 | lastre del pavimento in pietra | Kenney Impact: impactMining_003-004 |
| comparsa | lavoratore o banco che compare | Kenney RPG: cloth2 + Kenney Impact: impactSoft_medium_003 |
| corsa-neve | passi di gruppo (squadra piccola) | Freesound 712022 |
| corsa-neve-tanti | passi di gruppo (squadra grande) | Freesound 712022 (tre tagli sovrapposti) |
| carro | carro che avanza | Freesound 721122 |
| porta-buona | porta buona | Kenney Jingles Pizzicato: PIZZI16 |
| porta-cattiva | porta cattiva | Kenney Jingles Pizzicato: PIZZI09 |
| albero | albero abbattuto | Kenney RPG: creak1 + Kenney Impact: impactWood_heavy_001 |
| perso | boscaiolo perso | Kenney Impact: impactSoft_medium_002 |
| gradino-1…3 | passi sulla scalinata finale | Kenney Impact: footstep_wood_000-002 |
| resta-indietro | boscaiolo che resta su un gradino | Kenney Impact: impactSoft_heavy_002 |
| vittoria | vittoria | Kenney Jingles Steel: STEEL10 |
| sconfitta | sconfitta | Kenney Jingles Pizzicato: PIZZI07 |
| clic | pulsanti dei menu | Kenney RPG: bookPlace1 |
| nuovo-cerchio | compare un nuovo cerchio di miglioramento | Kenney Jingles Pizzicato: PIZZI13 |
| festa | fine del tutorial e "Bentornato!" | Kenney Jingles Steel: STEEL02 |
| grido-1…6 | grida allegre dei boscaioli nella corsa (Hey!, Yeah!, Woo-hoo!, tre uomini che esultano) | Freesound 57204, 274510, 340363, 475444, 468898, 557125 (nell'ordine) |
(m) => m| allarme-mura | le mura stanno cedendo (due rintocchi di campana, più bassi) | Kenney Impact: impactBell_heavy_001 |
| mura-cadute | le mura crollano (scricchiolio e tonfi di legno, sempre più bassi) | Kenney RPG: creak3 + Kenney Impact: impactWood_heavy_000, 004, 002, impactSoft_heavy_000, impactWood_medium_003 |
| passo-gigante | tonfo di un passo del lupo gigante | Kenney Impact: impactSoft_heavy_001 (più basso) |
| taglio-1…3 | colpi dell'ascia sul legno dell'albero nella corsa | Kenney Impact: impactPlank_medium_002-004 |
| musica-paura | musica inquietante mentre c'è il lupo gigante (loop di circa 29 s, tesa e cupa, con bassi e droni scuri; sfuma al posto dell'ukulele e poi torna) | Freesound 155139 "Action music loop with dark ambient drones", burning-mir |
| riparazione-mura | le mura sono state riparate con la legna (tre colpetti di martello sul legno e un campanellino) | Kenney Impact: impactWood_light_000-002 + Kenney Jingles Pizzicato: PIZZI08 |
| cerchio-riparazione | compare il grande cerchio verde per riparare le mura (un tonfo morbido e un campanellino) | Kenney Impact: impactSoft_heavy_000 (più basso) + Kenney Jingles Pizzicato: PIZZI12 |

## Suoni dei lavori dei cantieri (Gruppo 7)
| File | A cosa serve | Fonte |
|---|---|---|
| sega-1, sega-2 | una sega a mano che taglia una trave o un'asse, ogni tanto, nelle fasi di travi e assi del cantiere | Freesound 118031 "sawing of wood sound effect.wav", **greggace**, licenza **CC0** (https://freesound.org/people/greggace/sounds/118031/): due pezzi di 3 secondi (dal 4° al 7° e dall'8° all'11° secondo dell'originale), resi mono, con inizio e fine dolci, volume pareggiato e compressi in mp3 a 96 kbps |
| (martello, asse posata, "ehi!" lontano) | usano file già presenti: morso-1…3, legna-deposito, legna-schiena, grido-1 (vedi `EFFETTI` in `suoni.js`) | Kenney Impact / Freesound 57204 |

## Suoni dell'orso gigante (Gruppo 4)
| File | A cosa serve | Fonte |
|---|---|---|
| orso-ruggito | l'orso si alza e ruggisce, e quando vince | Freesound 763026 "Bear Angry Growl", celldroid, CC0: registrazione di un orso nero vero (era 439441, sostituito perché poco realistico) |
| orso-carica | grido di carica di tutta la squadra all'inizio dello scontro | Freesound 563011, florianreichelt, CC0 (secondi 12–15) |
| orso-folla-1…2 | grida di gruppo, più piene (squadra grande) | Freesound 563011, florianreichelt, CC0 |
| orso-grido-1…3 | grida di singoli boscaioli (squadra piccola) | Freesound 866009, Simonus18, CC0 |
| orso-colpo-1…3 | un boscaiolo colpisce l'orso | Kenney Impact Sounds "impactSoft_heavy_000-002", CC0 |
| orso-zampata | la zampata | Kenney RPG Audio "cloth2" + Kenney Impact Sounds "impactPunch_heavy_001" (colpo ritardato), CC0 |
| orso-cade | l'orso sconfitto cade | Kenney Impact Sounds "impactPunch_heavy_004" rallentato (tono dimezzato), CC0 |

Non li ho ascoltati: scelti dai nomi e dalle misure (il ruggito è la parte iniziale di un lungo verso "arrabbiato").
