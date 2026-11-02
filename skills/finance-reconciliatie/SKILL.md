---
name: finance-reconciliatie
description: "Rekeningen aansluiten en verschillen verklaren: aansluiting grootboek tegenover subadministratie (debiteuren, crediteuren, vaste activa, voorraad, vooruitbetaalde kosten), bankafschrift aansluiten, intercompany-aansluiting tussen entiteiten, openstaande posten categoriseren (timing, correctie, onderzoek), verschillenanalyse, ouderdomsanalyse en escalatiegrenzen, plus documentatie en functiescheiding. Triggers: aansluiting, aansluiten, reconciliatie, grootboek tegenover subadministratie, bankafschrift, bankaansluiting, intercompany, openstaande posten, verschillenanalyse, ouderdomsanalyse, aging, verschil tussen GL en subadministratie. Voor de planning en bewaking van de afsluiting zelf: finance-maandafsluiting."
---

# Finance-reconciliatie

Gebaseerd op [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (Apache-2.0, © Anthropic): de skill `reconciliation` uit de finance-plugin, commit `02ffa99`. Vertaald en aangepast aan de Nederlandse praktijk.

Deze skill helpt bij het werk maar geeft geen fiscaal, accounting- of auditadvies; laat uitkomsten door een bevoegde collega of accountant controleren.

## Context bij JBT Marel

- **Bronsysteem**: SAP is het grootboek en de subadministratie. Haal saldi en detailregels daar op; de skill verzint geen cijfers.
- **Resultatendata**: beschikbaar via de Oracle-view `LCV_KPTM` in schema `LCV_DATA`. Gebruik die voor analyses over perioden heen, niet als vervanging van de SAP-saldi waarop je aansluit.
- **Rapportage en analyse**: Power BI voor trends en ouderdom, Excel voor het aansluitwerkblad zelf.
- **Vastlegging en overleg**: het aansluitdossier en de onderbouwing bewaar je op SharePoint; afstemming met collega's en counterparties loopt via Teams.
- Er is geen koppeling die automatisch posten of boeken uitvoert. Jij voert de stappen in SAP zelf uit; deze skill zegt wat je controleert en hoe je het vastlegt.

Bedragen schrijf je als € 1.250,00, datums als dd-mm-jjjj (31-10-2025) en perioden als jjjjMM (202510).

## Soorten aansluiting

| Soort | Je vergelijkt | Typische frequentie |
|---|---|---|
| Grootboek tegenover subadministratie | Saldo van de tussenrekening in SAP tegenover het detailoverzicht | Maandelijks voor materiële rekeningen |
| Bankaansluiting | Grootboeksaldo liquide middelen tegenover het bankafschrift | Maandelijks, bij voorkeur doorlopend |
| Intercompany-aansluiting | Vordering van entiteit A op B tegenover schuld van B aan A | Maandelijks, vóór consolidatie |

### 1. Grootboek tegenover subadministratie

Je vergelijkt het saldo van de controlerekening in het grootboek met het totaal van de onderliggende subadministratie.

Veelvoorkomende rekeningen: debiteuren (tegenover de ouderdomslijst), crediteuren (tegenover de ouderdomslijst), vaste activa (tegenover het activaregister), voorraad (tegenover de voorraadwaardering), vooruitbetaalde kosten (tegenover het amortisatieschema) en overlopende passiva (tegenover de specificatie per post).

Werkwijze:

1. Haal het grootboeksaldo van de controlerekening per periode-einde op uit SAP.
2. Haal de subadministratie of het detailoverzicht per dezelfde datum op.
3. Vergelijk de totalen: bij realtime boeking horen die gelijk te zijn.
4. Onderzoek elk verschil en leg per verschil de oorzaak, het bedrag en de actiehouder vast.
5. Bepaal of het verschil vanzelf oplost (timing) of een correctieboeking vraagt.

Veelvoorkomende oorzaken van verschillen:

- Handmatige memoriaalboeking op de controlerekening zonder tegenhanger in de subadministratie.
- Transacties in de subadministratie die nog niet naar het grootboek zijn doorgezet.
- Timingverschil in batchverwerking.
- Herrubricering in het grootboek zonder aanpassing in de subadministratie.
- Mislukte of foutieve interface tussen systemen.

### 2. Bankaansluiting

1. Vraag het bankafschrift per periode-einde op.
2. Haal het grootboeksaldo van de bankrekening per dezelfde datum op.
3. Bepaal de uitgaande betalingen die wel geboekt maar nog niet door de bank verwerkt zijn.
4. Bepaal de ontvangsten onderweg: geboekt in het grootboek, nog niet bijgeschreven door de bank.
5. Bepaal bankkosten, rente en correcties die de bank wel en het grootboek nog niet kent.
6. Werk beide kanten toe naar hetzelfde gecorrigeerde saldo.

Vast format voor het werkblad:

```
Saldo volgens bankafschrift:            €  XX.XXX,XX
Bij: ontvangsten onderweg                €   X.XXX,XX
Af:  nog niet verwerkte betalingen      (€   X.XXX,XX)
Bij/af: fouten van de bank               €   X.XXX,XX
Gecorrigeerd banksaldo:                 €  XX.XXX,XX

Saldo volgens grootboek:                €  XX.XXX,XX
Bij: rente en creditposten nog te boeken €   X.XXX,XX
Af:  bankkosten nog te boeken           (€   X.XXX,XX)
Bij/af: fouten in het grootboek          €   X.XXX,XX
Gecorrigeerd grootboeksaldo:            €  XX.XXX,XX

Verschil:                                €       0,00
```

### 3. Intercompany-aansluiting

1. Haal per entiteitenpaar de intercompany-vorderingen en -schulden op.
2. Zet de vordering van entiteit A op entiteit B naast de schuld van B aan A.
3. Onderzoek de verschillen en spreek per verschil af wie corrigeert.
4. Controleer dat elke intercompany-transactie aan beide kanten is vastgelegd.
5. Controleer de eliminatieboekingen voor de consolidatie.

Veelvoorkomende oorzaken: de ene entiteit heeft al geboekt en de andere nog niet, verschillende wisselkoersen, verkeerde rubricering (intercompany tegenover derden), betwiste bedragen of niet-afgeletterde betalingen, en verschillende afsluitdata per entiteit.

## Openstaande posten categoriseren

| Categorie | Wat het is | Actie |
|---|---|---|
| 1. Timingverschil | Ontstaat door normale verwerkingstijd en lost vanzelf op: betalingen onderweg, ontvangsten onderweg, posten die nog door de interface moeten, transacties die op goedkeuring wachten | Geen boeking. Bewaken; hoort binnen 1-5 werkdagen weg te zijn |
| 2. Correctie nodig | Niet-geboekte bankkosten, niet-geboekte rente, boekingsfouten (verkeerd bedrag, verkeerde rekening, dubbel), ontbrekende boekingen, rubriceringsfouten | Memoriaalboeking in SAP opstellen en laten controleren |
| 3. Onderzoek nodig | Onverklaard verschil, betwiste post, post die te lang openstaat, verschil dat elke periode terugkomt | Oorzaak uitzoeken, bevindingen vastleggen, escaleren als het niet oplost |

Een verschil dat elke periode terugkomt is een procesprobleem, geen aansluitprobleem: los de oorzaak op in plaats van elke maand dezelfde regel over te nemen.

## Ouderdomsanalyse (aging)

| Ouderdom | Status | Actie |
|---|---|---|
| 0-30 dagen | Actueel | Bewaken, past binnen de normale verwerkingstijd |
| 31-60 dagen | Verouderd | Uitzoeken waarom de post nog openstaat |
| 61-90 dagen | Te oud | Escaleren naar je leidinggevende, onderzoek vastleggen |
| 90+ dagen | Blijvend open | Escaleren naar management; afboeking of correctie overwegen |

Format voor het overzicht:

| Nr. | Omschrijving | Bedrag | Ontstaan op | Ouderdom (dagen) | Categorie | Status | Eigenaar |
|---|---|---|---|---|---|---|---|
| 1 | [detail] | € 1.250,00 | 31-10-2025 | 45 | 2 | In behandeling | [naam] |

Volg daarnaast de ontwikkeling over de tijd: vergelijk het totaal aan openstaande posten met de vorige periode, signaleer als het totaal boven de materialiteitsgrens komt, signaleer als het aantal posten groeit, en benoem posten die elke periode terugkomen.

## Escalatiegrenzen

De grenzen hieronder zijn voorbeelden. Stel ze vast samen met de controller op basis van de materialiteit en het risicoprofiel van JBT Marel; leg de vastgestelde grenzen op SharePoint vast.

| Aanleiding | Grens (voorbeeld) | Escalatie |
|---|---|---|
| Bedrag van één post | > € 10.000,00 | Controle door leidinggevende |
| Bedrag van één post | > € 50.000,00 | Controle door controller |
| Totaal openstaande posten | > € 100.000,00 | Controle door controller |
| Ouderdom van een post | > 60 dagen | Opvolging door leidinggevende |
| Ouderdom van een post | > 90 dagen | Controller of management |
| Onverklaard verschil | Elk bedrag | Periode kan niet dicht: oplossen of expliciet vastleggen |
| Stijgende trend | 3 perioden op rij | Onderzoek naar procesverbetering |

## Werkafspraken

1. **Op tijd**: rond de aansluiting af binnen de deadline van de afsluitkalender (close calendar), meestal T+3 tot T+5 werkdagen na periode-einde.
2. **Volledig**: sluit alle balansrekeningen aan volgens een vastgelegde frequentie; materiële rekeningen maandelijks, immateriële per kwartaal.
3. **Vastgelegd**: elke aansluiting vermeldt opsteller, reviewer, datum en een begrijpelijke toelichting per openstaande post.
4. **Functiescheiding**: wie aansluit, verwerkt niet zelf de transacties op die rekening.
5. **Afgehandeld**: volg openstaande posten tot ze weg zijn; schuif ze niet eindeloos door.
6. **Oorzaak aanpakken**: zoek bij terugkerende posten uit welk proces het veroorzaakt.
7. **Uniform**: gebruik hetzelfde sjabloon en dezelfde werkwijze voor alle rekeningen.
8. **Bewaren**: bewaar aansluiting en onderbouwing volgens het bewaarbeleid van JBT Marel.

## Let op bij herkomst van de bron

De bron is geschreven vanuit de Amerikaanse praktijk (US GAAP/SOX; onder Nederlandse regels kan dit afwijken). Dat raakt vooral de nadruk op formele review- en documentatievereisten per aansluiting en op vaste functiescheidingsregels. Welke eisen voor JBT Marel gelden, en welke materialiteit, volgt uit de eigen administratieve organisatie en uit afspraken met de accountant; neem niets over als norm zonder dat te bevestigen.
