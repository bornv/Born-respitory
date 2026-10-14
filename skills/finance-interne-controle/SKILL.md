---
name: finance-interne-controle
description: "Interne beheersing en controletesten bij JBT Marel: SOX 404-testwerk voorbereiden, een beheersmaatregel (control) beschrijven en testen, opzet/bestaan/werking beoordelen, populatie bepalen en een steekproef trekken, werkdocumenten (workpapers) opstellen, bewijsmateriaal beoordelen, een tekortkoming (deficiency) classificeren en herstellen, functiescheiding en ITGC's controleren, het auditdossier ordenen en accountantsvragen beantwoorden. Gebruik bij vragen als 'hoe groot moet mijn steekproef zijn', 'is dit een materiële zwakte', 'wat moet er in mijn werkdocument', 'welk bewijs vraagt de accountant'. Voor de maandafsluiting: finance-maandafsluiting. Voor journaalposten: finance-journaalposten. Voor aansluitingen van grootboek en subadministratie: finance-reconciliatie. Voor verschillenanalyse en rapportage: finance-variantieanalyse."
---

# Interne controle en auditondersteuning

Gebaseerd op [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (Apache-2.0, © Anthropic): de skills `sox-testing` en `audit-support` uit de finance-plugin, commit `02ffa99`. Vertaald, samengevoegd en aangepast aan de Nederlandse praktijk.

Deze skill helpt bij het voorbereiden van controlewerk maar geeft **geen audit-, fiscaal of accountingadvies**; laat uitkomsten altijd door een bevoegde collega, interne auditor of accountant controleren. Een oordeel over de werking van een beheersmaatregel blijft mensenwerk.

## Context bij JBT Marel

SOX 404 is Amerikaanse wetgeving: het verplicht het management van een SEC-geregistreerde onderneming om de werking van de interne beheersing over de financiële verslaggeving (ICFR) te beoordelen. JBT Marel is onderdeel van een beursgenoteerde groep, dus SOX kan op jouw proces van toepassing zijn — maar de Nederlandse praktijk wijkt af:

- Je werkt in de eerste plaats met het **interne-beheersingsraamwerk van de groep**: de controlematrix, de testkalender en de rapportagesjablonen die vanuit de groep worden opgelegd. Die richtlijn is leidend, niet de algemene regels in deze skill.
- Daarnaast is er de **jaarrekeningcontrole door de accountant** volgens de Nederlandse controlestandaarden (NV COS). Dat is een ander doel: de accountant geeft een oordeel bij de jaarrekening en steunt op beheersmaatregelen alleen voor zover hij ze zelf heeft getoetst.
- "Interne beheersing" (internal control) is breder dan SOX: ook AO/IB, functiescheiding en procuratie vallen eronder, ook voor processen die buiten de SOX-scope liggen.
- Vraag bij elke opdracht expliciet: is dit **SOX-testwerk voor de groep**, werk voor de **interne auditor**, of een **vraag van de accountant**? De eisen aan dossier en bewijs verschillen.

### Begrippen: Engels naast Nederlands

| Engelse term (SOX) | Nederlandse term |
|---|---|
| control | beheersmaatregel |
| control owner | eigenaar van de beheersmaatregel |
| control matrix | controlematrix / beheersmaatregelenoverzicht |
| walkthrough | doorloop (één transactie van begin tot eind volgen) |
| test of design | toets op opzet |
| test of operating effectiveness | toets op bestaan en werking |
| population | populatie |
| sample | steekproef |
| exception | bevinding / uitzondering |
| deficiency | tekortkoming |
| significant deficiency | belangrijke tekortkoming |
| material weakness | materiële zwakte |
| compensating control | compenserende beheersmaatregel |
| segregation of duties | functiescheiding |
| ITGC (IT general controls) | algemene IT-beheersmaatregelen |
| IPE (information produced by the entity) | door de organisatie zelf aangeleverde informatie |
| workpaper | werkdocument |
| remediation | herstelmaatregel |

## Systemen en gegevensbronnen

| Waarvoor | Waar |
|---|---|
| Grootboek, inkoop (P2P), verkoop, vaste activa, voorraad | SAP |
| Resultatendata voor analyses en populaties | Oracle-view `LCV_KPTM` in schema `LCV_DATA` |
| Rapportage en visualisatie van populaties en uitzonderingen | Power BI |
| Werkdocumenten, bewijsstukken en het auditdossier | SharePoint |
| Steekproeftrekking, uitwerking van tests en aansluitingen | Excel |

Een populatie die je uit SAP of uit `LCV_KPTM` haalt, is zelf ook IPE: leg vast welke query, filters, periode (`jjjjMM`) en peildatum je hebt gebruikt, en sluit het totaal aan op het grootboek voordat je er een steekproef uit trekt.

## Werkwijze

| Je vraag of taak | Doe dit |
|---|---|
| "Welke beheersmaatregelen moet ik testen?" | [1. Scope en controlematrix](#1-scope-en-controlematrix) |
| "Is de maatregel goed opgezet?" | [2. Opzet toetsen (doorloop)](#2-opzet-toetsen-doorloop) |
| "Hoe groot moet mijn steekproef zijn?" | [3. Populatie en steekproef](#3-populatie-en-steekproef) |
| "Wat moet er in mijn werkdocument?" | [4. Werkdocument](#4-werkdocument) |
| "Is dit bewijs genoeg?" | [5. Bewijsmateriaal](#5-bewijsmateriaal) |
| "Is dit een tekortkoming, en hoe erg?" | [6. Tekortkomingen classificeren](#6-tekortkomingen-classificeren) |
| "Hoe los ik het op?" | [7. Herstel](#7-herstel) |
| "Hoe orden ik het dossier / beantwoord ik de accountant?" | [8. Auditdossier en accountantsvragen](#8-auditdossier-en-accountantsvragen) |

### 1. Scope en controlematrix

1. Bepaal de **significante posten**: een post is significant als er meer dan een verwaarloosbare kans is op een fout die op zichzelf of samen met andere fouten materieel is. Kwantitatief telt de omvang en het transactievolume; kwalitatief tellen complexe verslaggeving, fraudegevoeligheid, eerdere correcties, schattingen en nieuwe of gewijzigde processen.
2. Bepaal per post de relevante **beweringen (assertions)**: volledigheid, bestaan/voorkomen, nauwkeurigheid, waardering, rechten en verplichtingen, presentatie en toelichting. Voor omzet horen daar ook afgrenzing (cut-off) bij; voor debiteuren vooral bestaan en waardering van de voorziening.
3. Leg per risico vast welke beheersmaatregel het afdekt. Noteer het **soort maatregel**: geautomatiseerd (door SAP afgedwongen), handmatig (menselijk oordeel) of handmatig-met-systeemdata (IT-afhankelijk; dan test je ook de IPE).
4. Zet dit in een controlematrix:

| Nr. | Omschrijving beheersmaatregel | Soort | Frequentie | Sleutelmaatregel | Risico | Bewering |
|---|---|---|---|---|---|---|
| | | handmatig / geautomatiseerd / IT-afhankelijk | dagelijks / wekelijks / maandelijks / per kwartaal / jaarlijks | ja / nee | hoog / midden / laag | |

5. Bevestig de matrix bij de eigenaar van het proces en bij de groep voordat je gaat testen.

### 2. Opzet toetsen (doorloop)

De toets op **opzet** beantwoordt de vraag: is de maatregel zo ingericht dat hij een materiële fout kan voorkomen of ontdekken?

1. Volg één transactie van begin tot eind door het proces (de doorloop/walkthrough), bijvoorbeeld van inkooporder tot betaling in SAP.
2. Controleer of de maatregel op het juiste punt in het proces zit en het benoemde risico echt afdekt.
3. Stel vast wie hem uitvoert, met welke bevoegdheid en op basis van welke informatie.
4. Leg de doorloop vast met de gebruikte documentnummers en schermafbeeldingen.
5. Doe dit minimaal één keer per jaar en extra zodra het proces of het systeem wijzigt.

De toets op **bestaan en werking** komt daarna: werkte de maatregel de hele periode zoals bedoeld? Dat toets je met waarneming, inspectie, herberekening en navraag, op een steekproef die de hele periode afdekt. Navraag alleen is nooit voldoende.

### 3. Populatie en steekproef

1. **Definieer de populatie**: alle gebeurtenissen waarop de maatregel in de periode van toepassing was. Noteer aantal en totaalbedrag (bijvoorbeeld 1.482 posten, € 7.310.455,00).
2. **Sluit de populatie aan** op het grootboek of op een rapport dat je kunt aansluiten. Een steekproef uit een onvolledige populatie zegt niets.
3. **Kies een trekkingsmethode**:

| Methode | Wanneer | Hoe | Let op |
|---|---|---|---|
| Aselect (random) | standaard bij veel transacties | nummer de populatie, trek met een random generator | statistisch verdedigbaar; vraagt een volledige lijst |
| Systematisch | populatie is doorlopend genummerd, je wilt spreiding over de periode | interval = populatie ÷ steekproefomvang, willekeurig startpunt, daarna elke n-de post | een periodiek patroon in de data kan de uitkomst vertekenen |
| Gericht (judgmental) | aanvulling op aselect, of kleine/ongelijke populatie | kies posten met risicokenmerken: hoog bedrag, handmatige boeking, periode-einde, nieuwe leverancier, gelieerde partij | niet representatief; leg per post de reden vast |
| Willekeurig (haphazard) | alleen als aselect niet kan en de populatie homogeen is | kies zonder patroon, gespreid over de periode | niet statistisch; let op onbewuste voorkeur |

   Voorbeeld systematisch: populatie 1.000, steekproef 25 → interval 40, willekeurig startpunt 17, dus de posten 17, 57, 97, 137, …

4. **Bepaal de omvang.** De bron geeft deze indicatie; **de groepsrichtlijn of de accountant is leidend** — neem deze aantallen niet over als norm zonder bevestiging.

| Frequentie | Verwachte populatie | Laag risico | Midden risico | Hoog risico |
|---|---|---|---|---|
| Jaarlijks | 1 | 1 | 1 | 1 |
| Per kwartaal | 4 | 2 | 2 | 3 |
| Maandelijks | 12 | 2 | 3 | 4 |
| Wekelijks | 52 | 5 | 8 | 15 |
| Dagelijks | ca. 250 | 20 | 30 | 40 |
| Per transactie (kleine populatie, < 250) | < 250 | 20 | 30 | 40 |
| Per transactie (grote populatie) | 250+ | 25 | 40 | 60 |

   De omvang gaat omhoog bij: hoger inherent risico, een maatregel die als enige een significant risico afdekt, een tekortkoming in de vorige periode, een nieuwe of gewijzigde maatregel, en wanneer de accountant op jouw testwerk wil steunen.

   Voor een geautomatiseerde maatregel in SAP is volgens de bron meestal één toets voldoende, mits de systeeminstelling niet is gewijzigd en de ITGC's rond wijzigingsbeheer effectief zijn.

5. **Leg de trekking vast**: bronquery, datum (dd-mm-jjjj), periode (`jjjjMM`), populatieomvang, methode, startpunt of seed, en de getrokken posten met referentie en bedrag.

### 4. Werkdocument

Elk werkdocument bevat minimaal:

1. **Identificatie**: nummer en omschrijving van de beheersmaatregel (wat gebeurt er, door wie, hoe vaak), soort, frequentie, eigenaar, risico en bewering, testperiode.
2. **Opzet van de test**: doelstelling, stapsgewijze testprocedures, het bewijs dat je verwacht aan te treffen, en de onderbouwing van de steekproefmethode en -omvang.
3. **Uitvoering**: populatieomschrijving en -omvang, getrokken posten, per post het resultaat met het concreet onderzochte bewijs, en elke bevinding volledig beschreven.
4. **Conclusie**: oordeel (effectief / tekortkoming / belangrijke tekortkoming / materiële zwakte), de onderbouwing, de impact van bevindingen en de eventueel meegewogen compenserende maatregelen.
5. **Paraaf**: opsteller met datum en reviewer met datum.

Resultaten per post leg je zo vast:

| Nr. | Referentie (SAP-document) | Datum | Bedrag | Stap 1 | Stap 2 | Stap 3 | Uitkomst | Bevinding? | Toelichting |
|---|---|---|---|---|---|---|---|---|---|
| 1 | | dd-mm-jjjj | € 1.250,00 | ja/nee | ja/nee | ja/nee | akkoord / niet akkoord | ja/nee | |

Bij een handmatige maatregel toets je per post altijd: is hij uitgevoerd door iemand met de juiste bevoegdheid, op tijd, aantoonbaar (paraaf, e-mail, systeemlog), op basis van voldoende informatie, en zijn geconstateerde uitzonderingen ook echt opgevolgd?

### 5. Bewijsmateriaal

| Voldoende bewijs | Onvoldoende bewijs |
|---|---|
| Schermafbeelding van een door SAP afgedwongen instelling of workflow | Alleen mondelinge bevestiging, zonder onderbouwing |
| Ondertekend of geparafeerd goedkeuringsdocument | Een document zonder datum |
| E-mailgoedkeuring met herleidbare afzender en datum | Bewijs zonder herleidbare uitvoerder of goedkeurder |
| Systeemlog met wie, wat en wanneer | Een rapport zonder datum- en tijdstempel |
| Herberekening met aansluitend resultaat | "Volgens navraag bij …" zonder onderliggend stuk |
| Waarnemingsverslag met datum, plaats en waarnemer | Een export die niet op het grootboek aansluit |

Gebruikt de maatregel een rapport uit SAP, `LCV_KPTM` of Power BI, dan toets je naast de maatregel zelf ook de **volledigheid en juistheid van dat rapport** (IPE): bronsysteem, gebruikte filters en parameters, en aansluiting van het totaal op het grootboek.

### 6. Tekortkomingen classificeren

| Niveau | Betekenis | Signalen |
|---|---|---|
| **Tekortkoming** (deficiency) | De opzet of werking maakt het niet mogelijk fouten tijdig te voorkomen of te ontdekken. | Weeg de kans op een fout, de mogelijke omvang en het bestaan van een compenserende maatregel. |
| **Belangrijke tekortkoming** (significant deficiency) | Minder ernstig dan een materiële zwakte, maar belangrijk genoeg voor wie toezicht houdt. | Fout kan meer dan verwaarloosbaar maar minder dan materieel zijn; sleutelmaatregel die niet volledig wordt afgedekt door een compenserende maatregel; of een optelsom van kleine tekortkomingen. |
| **Materiële zwakte** (material weakness) | Er is een redelijke mogelijkheid dat een materiële fout in de jaarrekening niet tijdig wordt voorkomen of ontdekt. | Fraude door het hoger management (ongeacht omvang); herstel van eerder gepubliceerde cijfers; een materiële fout die de accountant vindt en de eigen maatregelen niet; ineffectief toezicht op de verslaggeving; een tekortkoming in een brede maatregel (entiteitsniveau of ITGC) die meerdere processen raakt. |

Bepaal daarnaast het **gecombineerde effect**: tel tekortkomingen in hetzelfde proces of bij dezelfde bewering bij elkaar op, beoordeel of ze samen tot een materiële fout kunnen leiden, en leg die afweging vast. De uiteindelijke classificatie — en vooral de weging van "materieel" — is een oordeel van de interne auditor, de groep of de accountant, niet van deze skill.

### 7. Herstel

Leg per tekortkoming vast:

1. **Oorzaak**: ontwerpfout, uitvoeringsfout, bezetting, onvoldoende instructie of een systeemprobleem.
2. **Herstelmaatregel**: wat er concreet verandert (opzet aanpassen, instructie geven, SAP-instelling wijzigen, extra review toevoegen).
3. **Termijn**: streefdatum in dd-mm-jjjj.
4. **Eigenaar**: wie het uitvoert.
5. **Hertest**: hoe en wanneer je vaststelt dat de herstelde maatregel werkt. Reken op voldoende tijd: de maatregel moet lang genoeg hebben gewerkt om opnieuw een steekproef te kunnen trekken.

### 8. Auditdossier en accountantsvragen

Orden het dossier per proces en per jaar op SharePoint, bijvoorbeeld:

```
Interne controle/
└── <jaar>/
    ├── Scope en risicoanalyse/
    ├── Verkoop (order-to-cash)/
    │   ├── Controlematrix
    │   ├── Doorloop
    │   ├── Werkdocumenten (één per maatregel)
    │   └── Bewijsstukken
    ├── Inkoop (procure-to-pay)/
    ├── Personeelskosten/
    ├── Financiële afsluiting/
    ├── Vaste activa/
    ├── Voorraad/
    ├── Algemene IT-beheersmaatregelen (ITGC)/
    └── Samenvatting en conclusies/
        ├── Beoordeling tekortkomingen
        └── Managementconclusie
```

Bij een vraag van de accountant of de interne auditor:

1. Vraag door tot de vraag concreet is: welke maatregel, welke periode (`jjjjMM`), welke post, en waarvoor het bewijs dient.
2. Lever uit de bron, niet uit een tussenbestand: een SAP-document of -rapport, een export uit `LCV_KPTM`, of het werkdocument zelf.
3. Vermeld bij elke levering de bron, de gebruikte filters en de datum van onttrekking (dd-mm-jjjj); bedragen in euro's (€ 1.250,00).
4. Bevestig niets wat je niet hebt gezien. Weet je het niet, verwijs dan naar de eigenaar van het proces.
5. Houd een logboek bij van gestelde vragen en geleverde stukken, zodat je niet twee keer dezelfde export maakt en de accountant ziet wat er al ligt.

## Veelvoorkomende maatregelen per proces

| Proces | Waar je typisch op test |
|---|---|
| Verkoop (order-to-cash) | goedkeuring van de order, bewijs van levering of prestatie, moment van omzetverantwoording tegenover de contractvoorwaarden, prijs tegenover contract of prijslijst, goedkeuring en grond van creditnota's |
| Inkoop (procure-to-pay) | goedkeuring van de inkooporder binnen de procuratie, driewegmatch (order, ontvangst, factuur), wijzigingen in het leveranciersstambestand, betalingsgoedkeuring met functiescheiding, blokkering van dubbele facturen |
| Financiële afsluiting | volledigheid en tijdigheid van aansluitingen, goedkeuring van handmatige journaalposten met functiescheiding, managementreview van de cijfers, consolidatie- en eliminatieposten, afvinklijst toelichtingen |
| ITGC | toekennen en intrekken van autorisaties (uitdiensttreding tijdig verwerkt), beheer en bewaking van verhoogde rechten, periodieke autorisatiereview, wijzigingsbeheer (aanvraag, test, goedkeuring, scheiding van ontwikkel- en productieomgeving), bewaking van batchverwerking, back-up en herstel |
| Entiteitsniveau | gedragscode en toon aan de top, risicobeoordelingsproces, toezicht op de verslaggeving, interne auditfunctie, frauderisicoanalyse, meldregeling, deskundigheid en bezetting van de financiële functie |

Maatregelen op entiteitsniveau kunnen procesmaatregelen wel ondersteunen maar niet vervangen; zijn ze ineffectief, dan is dat een sterke aanwijzing voor een materiële zwakte.

## Controle voor oplevering

- [ ] Duidelijk of het om SOX-testwerk voor de groep, interne audit of de jaarrekeningcontrole (NV COS) gaat.
- [ ] Groepsrichtlijn of accountant genoemd als leidend voor steekproefomvang en materialiteit; geen eigen normen verzonnen.
- [ ] Populatie gedefinieerd, aangesloten op het grootboek en vastgelegd met bron, filters en periode (`jjjjMM`).
- [ ] Steekproefmethode en -omvang onderbouwd; gerichte selecties per post gemotiveerd.
- [ ] Werkdocument bevat identificatie, testopzet, uitvoering, conclusie en parafen van opsteller én reviewer.
- [ ] Bewijs is gedateerd en herleidbaar tot een persoon; navraag niet als enig bewijs gebruikt.
- [ ] IPE getoetst voor elk rapport uit SAP, `LCV_KPTM` of Power BI waarop een maatregel steunt.
- [ ] Bevindingen beschreven met oorzaak, impact en eventuele compenserende maatregel; classificatie voorgelegd aan een bevoegde beoordelaar.
- [ ] Herstelmaatregelen hebben eigenaar, streefdatum (dd-mm-jjjj) en een afgesproken hertest.
- [ ] Bedragen in euro's (€ 1.250,00), datums dd-mm-jjjj, perioden `jjjjMM`.
- [ ] Geen oordeel over effectiviteit, materialiteit of de jaarrekening gepresenteerd als definitief.
