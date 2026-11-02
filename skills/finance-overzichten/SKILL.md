---
name: finance-overzichten
description: "Financiële overzichten opstellen en controleren: winst-en-verliesrekening (resultatenrekening, P&L), balans en kasstroomoverzicht, met periodevergelijking (vorige maand, vorig jaar, budget), maand- en kwartaalrapportage, marge en EBITDA, materiële verschillen signaleren en periodeafsluitingsposten (overlopende posten, afschrijving, voorziening, herwaardering). Gebruik bij 'maak de P&L voor 2025M09', 'balans per 30-09-2025', 'kasstroomoverzicht indirecte methode', 'brutomarge per periode', 'wat is onze EBITDA'. Voor het uitsplitsen van één verschil naar prijs, volume, mix en timing: finance-variantieanalyse. Voor het model en de DAX erachter: pbi-model-power-query-dax."
---

# Financiële overzichten

Gebaseerd op [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (Apache-2.0, © Anthropic): de skill `financial-statements` uit de finance-plugin, commit `02ffa99`. Vertaald en aangepast aan de Nederlandse praktijk.

Deze skill helpt bij de analyse maar geeft geen fiscaal, accounting- of auditadvies; laat uitkomsten door een bevoegde collega of accountant controleren.

Je stelt hiermee een winst-en-verliesrekening (income statement), een balans (balance sheet) en een kasstroomoverzicht (cash flow statement) op, met vergelijking tegen de vorige periode, dezelfde periode vorig jaar en het budget. Claude rekent, structureert en schrijft de toelichting; **jij** haalt de data op en controleert de uitkomst.

## Uitgangspunten

- **Bron van de resultatendata bij JBT Marel**: SAP, ontsloten via de Oracle-view `LCV_KPTM` in schema `LCV_DATA`. Rapportage gaat verder in Power BI en Excel; definitieve overzichten zet je op SharePoint.
- **Veldnamen, grootboekrekeningen en SAP-termen blijven ongewijzigd.** Vertaal ze niet in code of query's.
- **Perioden noteer je als `jjjjMM`** (bijvoorbeeld `2025M09` of `202509`, zoals de bron het aanlevert), datums als dd-mm-jjjj.
- **Bedragen in euro's**: € 1.250,00 — punt als duizendtalscheiding, komma als decimaalteken. Percentages met komma: 12,5%.
- **Vreemde valuta**: noteer altijd de gebruikte koers en koersdatum; reken niet stilzwijgend om.
- **Geen cijfer zonder bron.** Noem per regel de view, query of het bestand waar het getal vandaan komt.

## Werkwijze

| Je vraag | Aanpak | Zie |
|---|---|---|
| Maandrapportage of kwartaalrapportage opstellen | Stappen 1 t/m 6 hieronder | [Stappenplan](#stappenplan) |
| Welke kolommen en vergelijkingen horen erin? | Kies de vergelijkingsbasis | [Periodevergelijking](#periodevergelijking) |
| Welk verschil is groot genoeg om uit te zoeken? | Materialiteitsdrempels | [Materialiteit](#materialiteit-materiality) |
| Waardoor komt een verschil precies? | Opsplitsen naar prijs, volume, mix, timing | skill `finance-variantieanalyse` |
| Balans of kasstroomoverzicht opbouwen | Referentie-indelingen | [Balans](#balans-balance-sheet), [Kasstroom](#kasstroomoverzicht-cash-flow-statement) |
| Welke posten horen bij de afsluiting? | Checklist periodeafsluiting | [Periodeafsluiting](#posten-bij-de-periodeafsluiting) |
| Marge of EBITDA berekenen | Kengetallen | [Kengetallen](#kengetallen) |
| Measures of Power Query erachter bouwen | Andere skill | `pbi-model-power-query-dax` |

## Stappenplan

1. **Periode en scope vastleggen.** Welke periode (`jjjjMM`), welke entiteit of divisie, welke valuta, en welke vergelijkingen (vorige periode, vorig jaar, budget, forecast).
2. **Data ophalen.** Haal de saldibalans of resultatendata voor de periode uit `LCV_DATA.LCV_KPTM`, plus dezelfde data voor elke vergelijkingsperiode en het budget. Neem de rekeningstructuur (rekeningschema en groepering) mee, anders klopt de presentatie niet.
3. **Aansluiten vóór je presenteert.** Controleer dat het totaal van de saldibalans op nul sluit, dat het resultaat uit de winst-en-verliesrekening gelijk is aan de mutatie in het eigen vermogen, en dat de vergelijkingsperioden dezelfde rekeningstructuur gebruiken.
4. **Overzicht opbouwen** in de indeling hieronder, met vaste volgorde en subtotalen.
5. **Verschillen berekenen en toetsen** aan de materialiteitsdrempels; markeer wat onderzoek vraagt.
6. **Toelichting schrijven** bij elk materieel verschil, met kengetallen en een lijst openstaande vragen.

## Winst-en-verliesrekening (income statement)

Nederlandse categoriale indeling (naar aard van de kosten), met de functionele regels die JBT Marel in de managementrapportage gebruikt.

| Regel | Periode | Vorige periode | Verschil (€) | Verschil (%) | Budget | Verschil budget (€) |
|---|---:|---:|---:|---:|---:|---:|
| Netto-omzet machines | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| Netto-omzet service en onderdelen | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| Overige opbrengsten | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| **Totaal netto-omzet** | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| Kostprijs van de omzet (materiaal, uitbesteed werk) | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| **Brutomarge** | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| Brutomarge in % | 0,0% | 0,0% | 0,0 pp | | 0,0% | |
| Personeelskosten | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| Verkoop- en marketingkosten | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| Algemene en beheerskosten | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| Overige bedrijfskosten | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| **EBITDA** | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| Afschrijvingen en amortisatie | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| **Bedrijfsresultaat (EBIT)** | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| Financiële baten en lasten | € 0,00 | € 0,00 | € 0,00 | 0,0% | | |
| **Resultaat vóór belasting** | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |
| Belastingen | € 0,00 | € 0,00 | € 0,00 | 0,0% | | |
| **Nettoresultaat** | € 0,00 | € 0,00 | € 0,00 | 0,0% | € 0,00 | € 0,00 |

Presentatieregels:

- Kies bewust tussen de **categoriale indeling** (naar aard: materiaal, personeel, afschrijving) en de **functionele indeling** (naar functie: kostprijs omzet, verkoop, algemeen). Onder de Richtlijnen voor de Jaarverslaggeving (RJ 270) en IFRS (IAS 1) mag beide; houd het per rapportagelijn consistent en wissel niet tussen perioden.
- Presenteer operationele en financiële posten gescheiden, met belastingen op een eigen regel.
- Buitengewone baten en lasten bestaan niet meer als aparte categorie; eenmalige posten licht je toe.
- De bron is US GAAP-georiënteerd (ASC 220, ASC 606); onder Nederlandse regels (RJ) of IFRS kan de presentatie afwijken, met name bij omzetuitsplitsing, leases en beëindigde bedrijfsactiviteiten.

## Periodevergelijking

| Vergelijking | Waarvoor | Let op |
|---|---|---|
| Periode tegen vorige periode | Trend en seizoen binnen het jaar | Ongelijk aantal werkdagen vertekent het beeld |
| Periode tegen dezelfde periode vorig jaar | Groei, seizoenvrij | Stelselwijzigingen en reorganisaties maken reeksen onvergelijkbaar |
| Periode tegen budget | Sturing en beoordeling | Budget ligt vast; verschil kan ook aan het budget liggen |
| Periode tegen forecast | Vroege signalering | Forecast is onderhanden; benoem de versie en datum |
| Jaar tot en met periode (YTD) | Totaalbeeld, dempt ruis | De lopende, onvolledige maand telt niet mee bij jaarcijfers |

## Materialiteit (materiality)

Leg de drempel vooraf vast en gebruik hem consequent; achteraf schuiven maakt de analyse onbetrouwbaar.

| Omvang van de regel | Drempel in euro's | Drempel in procenten |
|---|---:|---:|
| Boven € 10.000.000,00 | € 500.000,00 | 5,0% |
| € 1.000.000,00 tot € 10.000.000,00 | € 100.000,00 | 10,0% |
| Onder € 1.000.000,00 | € 50.000,00 | 15,0% |

Een verschil is materieel als het de drempel in euro's **of** in procenten overschrijdt. Deze bedragen zijn een startpunt: stem ze af op de omvang van de entiteit. Margeverschillen druk je uit in procentpunten (pp), niet in procenten van een percentage.

## Kengetallen

| Kengetal | Berekening | Opmerking |
|---|---|---|
| Omzetgroei | (omzet periode − omzet vergelijkingsperiode) / omzet vergelijkingsperiode | Vermeld welke vergelijkingsbasis |
| Brutomarge % | brutomarge / netto-omzet | Noem wat wel en niet in de kostprijs zit |
| EBITDA | bedrijfsresultaat + afschrijvingen en amortisatie | Geen wettelijk gedefinieerd begrip; definitie erbij vermelden |
| EBITDA-marge % | EBITDA / netto-omzet | |
| Bedrijfsresultaatmarge % | EBIT / netto-omzet | |
| Nettomarge % | nettoresultaat / netto-omzet | |
| Kosten als % van de omzet | bedrijfskosten / netto-omzet | Handig bij schaalvragen |
| Effectieve belastingdruk % | belastingen / resultaat vóór belasting | Verschilt van het nominale tarief |

## Balans (balance sheet)

Nederlandse volgorde: activa van vast naar vlottend, passiva van eigen vermogen naar kortlopende schulden.

| Activa | Passiva |
|---|---|
| Immateriële vaste activa (goodwill, software) | Eigen vermogen (gestort kapitaal, agio, reserves, resultaat) |
| Materiële vaste activa (gebouwen, machines, inventaris) | Voorzieningen (garantie, reorganisatie, pensioen) |
| Financiële vaste activa en deelnemingen | Langlopende schulden (leningen, leaseverplichtingen) |
| Voorraden (grond- en hulpstoffen, onderhanden werk, gereed product) | Kortlopende schulden (crediteuren, overlopende passiva, belastingen) |
| Vorderingen (debiteuren, overlopende activa, onderhanden projecten) | |
| Liquide middelen | |

Aandachtspunten:

- Debiteuren presenteer je onder aftrek van de voorziening voor oninbaarheid; materiële vaste activa onder aftrek van cumulatieve afschrijving.
- Het deel van een langlopende lening dat binnen twaalf maanden vervalt, verschuift naar kortlopende schulden.
- Goodwill wordt onder RJ afgeschreven over de gebruiksduur; onder IFRS (en US GAAP, ASC 350) niet, maar jaarlijks op bijzondere waardevermindering getoetst. Dit is een echt verschil tussen stelsels: controleer welk stelsel geldt.
- Leases: IFRS 16 (en US GAAP ASC 842) zetten vrijwel alle leases op de balans; onder RJ blijft het onderscheid operationele/financiële lease bestaan.
- Controleer dat totaal activa gelijk is aan totaal passiva vóór je het overzicht deelt.

## Kasstroomoverzicht (cash flow statement)

De indirecte methode is in de praktijk gebruikelijk: je begint bij het nettoresultaat en corrigeert voor posten zonder kasstroom en voor mutaties in het werkkapitaal.

| Onderdeel | Inhoud |
|---|---|
| Kasstroom uit operationele activiteiten | Nettoresultaat; plus afschrijving en amortisatie; plus mutatie voorzieningen; plus/min mutatie voorraden, debiteuren, crediteuren en overlopende posten; betaalde rente en belasting |
| Kasstroom uit investeringsactiviteiten | Investeringen in en desinvesteringen van materiële en immateriële vaste activa, deelnemingen, acquisities |
| Kasstroom uit financieringsactiviteiten | Opname en aflossing van leningen, leasebetalingen, dividend, kapitaalstortingen |
| Aansluiting | Beginstand liquide middelen + som van de drie kasstromen + koersverschillen = eindstand |

Aandachtspunten: betaalde rente en belasting worden apart toegelicht; transacties zonder kasstroom (bijvoorbeeld een activum verworven via lease) horen niet in het overzicht maar in de toelichting. Liquide middelen omvatten direct opvraagbare tegoeden en beleggingen met een oorspronkelijke looptijd van maximaal drie maanden.

## Posten bij de periodeafsluiting

1. **Overlopende passiva**: kosten die zijn gemaakt maar nog niet gefactureerd (inkoop, personeel, rente).
2. **Overlopende activa**: vooruitbetaalde kosten toerekenen aan de juiste periode.
3. **Afschrijving en amortisatie** boeken volgens het vaste-activaregister.
4. **Voorziening oninbaarheid** bijstellen op basis van de ouderdomsanalyse van debiteuren.
5. **Voorraadwaardering**: afwaardering voor incourante en langzaam lopende voorraad.
6. **Onderhanden werk en projecten**: opbrengst toerekenen naar voortgang, niet naar factuurmoment.
7. **Herwaardering vreemde valuta** van monetaire posten tegen de koers per balansdatum.
8. **Belastinglast** (acuut en latent) opnemen.

Herrubriceringen: langlopend naar kortlopend, salderen van voorzieningen met brutoposten, eliminatie van intercompanyposten in de consolidatie, en een consistente indeling per segment.

## Controle voor oplevering

- [ ] Periode, entiteit, valuta en vergelijkingsbasis staan boven het overzicht.
- [ ] Totaal activa is gelijk aan totaal passiva; het resultaat sluit aan op de mutatie eigen vermogen.
- [ ] Alle vergelijkingsperioden gebruiken dezelfde rekeningstructuur en dezelfde indeling.
- [ ] Bedragen in € met punt en komma volgens afspraak; percentages met komma; perioden als `jjjjMM`; datums als dd-mm-jjjj.
- [ ] Materialiteitsdrempel vooraf vastgelegd en overal toegepast.
- [ ] Elk materieel verschil heeft een toelichting met oorzaak, bedrag en of het eenmalig is.
- [ ] Bij EBITDA en andere niet-wettelijke kengetallen staat de gehanteerde definitie erbij.
- [ ] Bron per cijfer vermeld (`LCV_DATA.LCV_KPTM`, Power BI-model, Excel-bestand).
- [ ] Verschil tussen RJ, IFRS en US GAAP benoemd waar het de presentatie raakt.
- [ ] Het overzicht is door een bevoegde collega of de accountant gecontroleerd vóór extern gebruik.
