---
name: finance-journaalposten
description: "Journaalposten opstellen en controleren voor de maandafsluiting: boekingsstuk/memoriaal met debet en credit, reservering (accrual) voor nog te ontvangen facturen, overlopende posten (prepaid), afschrijving van vaste activa, loonkosten, omzetverantwoording en uitgestelde omzet, plus periodeafgrenzing (cut-off), onderbouwing, terugboeking en reviewchecklist. Gebruik bij vragen als 'maak een journaalpost voor', 'hoe boek ik deze reservering', 'klopt dit boekingsstuk', 'welke tegenrekening', 'moet deze post terugboeken'. Voor het ophalen en modelleren van de resultatendata zelf: pbi-model-power-query-dax. Voor Fabric/Power BI-platformvragen: fabric-basis."
---

# Journaalposten opstellen (maandafsluiting)

Gebaseerd op [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (Apache-2.0, © Anthropic): de skills `journal-entry` en `journal-entry-prep` uit de finance-plugin, commit `02ffa99`. Vertaald, samengevoegd en aangepast aan de Nederlandse praktijk.

**Let op:** deze skill helpt bij het opstellen van journaalposten maar geeft geen fiscaal, accounting- of auditadvies; laat uitkomsten altijd door een bevoegde collega of accountant controleren.

Je werkt bij JBT Marel met SAP als grootboek; resultaten- en grootboekdata lees je uit de Oracle-views `LCV_KPTM` en `LCV_DATA`, en je rapporteert verder in Power BI, SharePoint en Excel. Claude rekent de post voor je uit en zet hem in tabelvorm klaar; **jij** boekt hem in SAP en laat hem goedkeuren.

## Werkwijze

| Jouw vraag | Aanpak | Zie |
|---|---|---|
| "Wat moet ik boeken voor nog niet gefactureerde kosten?" | Reservering (accrual) berekenen uit openstaande PO's en contracten | [Reservering (accrual)](#reservering-accrual) |
| "Afschrijving deze periode" | Afschrijvingsstaat per activaklasse en methode | [Afschrijving vaste activa](#afschrijving-vaste-activa) |
| "Vooruitbetaalde verzekering/licentie verdelen" | Overlopende posten (prepaid) amortiseren | [Overlopende posten (prepaid)](#overlopende-posten-prepaid) |
| "Loonkosten over de laatste dagen van de maand" | Loonreservering, vakantiegeld, werkgeverslasten | [Loonkosten](#loonkosten) |
| "Omzet nemen of uitstellen" | Prestatieverplichtingen beoordelen | [Omzet en uitgestelde omzet](#omzet-en-uitgestelde-omzet) |
| "Klopt dit boekingsstuk?" | Reviewchecklist aflopen | [Reviewchecklist](#reviewchecklist) |
| "Zit dit in de juiste periode?" | Periodeafgrenzing (cut-off) op lever-/prestatiedatum | [Veelvoorkomende fouten](#veelvoorkomende-fouten) |

## Stap 1 — Brondata verzamelen

1. Haal de grootboekmutaties en saldibalans voor de periode (`jjjjMM`, bijvoorbeeld `202610`) uit SAP, of uit de Oracle-view `LCV_KPTM` / `LCV_DATA` als je al met een Power BI-export werkt.
2. Haal de subadministratie op die bij de post hoort: openstaande PO's en goederenontvangsten, de activastaat, de amortisatiestaat van overlopende posten of de loonjournaal.
3. Haal de gelijksoortige post van de vorige periode op als referentie — zo zie je afwijkingen en voorkom je dubbele boekingen.
4. Heb je geen export? Vraag de gebruiker om de saldi en onderbouwing als Excel-bestand of geplakte tabel. Verzin nooit rekeningnummers of saldi.

## Stap 2 — De post berekenen

### Reservering (accrual)

Voor goederen of diensten die in de periode zijn ontvangen maar nog niet gefactureerd.

- **Debet:** kostenrekening (of activarekening als het geactiveerd moet worden)
- **Credit:** nog te ontvangen facturen / overlopende passiva

Bronnen: openstaande PO's met bevestigde ontvangst, contracten met geleverde maar niet gefactureerde diensten, terugkerende leveranciersafspraken (energie, abonnementen, advieskosten) en ingediende maar nog niet verwerkte declaraties.

Aandachtspunten: zet de post op automatisch terugboeken in de volgende periode, gebruik elke periode dezelfde schattingsmethode, leg de basis van de schatting vast (PO-bedrag, contractvoorwaarde, historisch gemiddelde) en vergelijk achteraf werkelijk versus gereserveerd om je schatting te verbeteren.

### Afschrijving vaste activa

- **Debet:** afschrijvingskosten (per afdeling/kostenplaats)
- **Credit:** cumulatieve afschrijving

| Methode | Berekening | Gebruik |
|---|---|---|
| Lineair (straight-line) | (aanschafwaarde − restwaarde) / levensduur | Meest gebruikt voor de jaarrekening |
| Degressief (declining balance) | Vast percentage over de boekwaarde | Versneld afschrijven |
| Naar gebruik (units of production) | Werkelijk gebruik / totaal verwacht gebruik | Machines met meetbare output |

Aandachtspunten: draai de afschrijving vanuit de activastaat, controleer dat nieuwe activa de juiste levensduur en methode hebben, kijk of er desinvesteringen of bijzondere waardeverminderingen zijn die afgeboekt moeten worden, en houd commercieel en fiscaal afschrijven uit elkaar.

### Overlopende posten (prepaid)

Vooruitbetaalde kosten verdelen over de periode waarin je er voordeel van hebt.

- **Debet:** kostenrekening (verzekering, software, huur)
- **Credit:** vooruitbetaalde kosten

Typische categorieën: verzekeringspremies (meestal 12 maanden), softwarelicenties en abonnementen, vooruitbetaalde huur, onderhoudscontracten en aanbetalingen voor beurzen of evenementen.

Aandachtspunten: houd een amortisatiestaat bij met begin- en einddatum en het maandbedrag (bijvoorbeeld € 1.250,00 per maand), boek onbetekenende bedragen in één keer als kosten, amortiseer versneld bij opgezegde contracten, en voeg nieuwe vooruitbetalingen direct toe aan de staat.

### Loonkosten

| Post | Debet | Credit |
|---|---|---|
| Salarisreservering (betaalperiode loopt niet gelijk met maandeinde) | Salariskosten (per afdeling) | Nog te betalen lonen |
| Bonusreservering | Bonuskosten (per afdeling) | Nog te betalen bonus |
| Sociale lasten en emolumenten | Personeelskosten | Nog te betalen personeelskosten |
| Werkgeverslasten | Loonheffingen | Nog af te dragen loonheffingen |

Aandachtspunten: bereken de salarisreservering op basis van gewerkte dagen in de periode versus de betaalperiode, baseer de bonusreservering op de regeling (doelbedrag, prestatiecriteria, uitbetaalmoment), neem de werkgeverslasten mee en reserveer de verplichting voor niet-opgenomen vakantie-uren en vakantiegeld als het beleid of de cao dat vraagt. De bron noemt hier FICA, FUTA en 401k-match: dat is US GAAP en Amerikaanse wetgeving; onder Nederlandse regels (RJ/IFRS) kan dit afwijken — controleer met je controller welke posten voor JBT Marel gelden.

### Omzet en uitgestelde omzet

| Situatie | Debet | Credit |
|---|---|---|
| Eerder uitgestelde omzet alsnog nemen | Uitgestelde omzet | Omzet |
| Omzet nemen met nieuwe vordering | Debiteuren | Omzet |
| Vooruitontvangen bedrag uitstellen | Liquide middelen / debiteuren | Uitgestelde omzet |

Aandachtspunten: splits het contract in afzonderlijke prestatieverplichtingen, bepaal de transactieprijs inclusief variabele vergoedingen, verdeel die prijs over de prestatieverplichtingen en neem omzet wanneer een prestatieverplichting is voldaan. Houd de onderbouwing op contractniveau bij voor de accountant. De bron verwijst naar het vijfstappenmodel van ASC 606: dat is US GAAP; onder Nederlandse regels (RJ/IFRS, waar IFRS 15 een vergelijkbaar vijfstappenmodel kent) kan dit afwijken — controleer met je controller welk kader JBT Marel toepast.

## Stap 3 — Het boekingsstuk opstellen

Presenteer de post altijd in dit formaat:

```
Journaalpost: <type> — periode 202610
Opgesteld door: <naam>      Datum: 31-10-2026

| Regel | Rekening | Omschrijving rekening | Debet      | Credit     | Kostenplaats | Toelichting |
|-------|----------|-----------------------|------------|------------|--------------|-------------|
| 1     | <nr>     | <naam>                | € 1.250,00 |            | <kstpl>      | <detail>    |
| 2     | <nr>     | <naam>                |            | € 1.250,00 | <kstpl>      | <detail>    |
|       |          | **Totaal**            | € 1.250,00 | € 1.250,00 |              |             |

Onderbouwing: <berekening en aannames, verwijzing naar de staat of PO>
Terugboeken: ja/nee — bij ja: terugboekdatum 01-11-2026
```

Elke journaalpost heeft zeven vaste onderdelen: (1) een duidelijke omschrijving van wat en waarom, (2) de berekening of formule, (3) de brondocumenten (PO-nummer, factuurnummer, contract, loonjournaal), (4) de periode, (5) wie hem heeft opgesteld en wanneer, (6) bewijs van review en goedkeuring volgens de bevoegdhedenmatrix, en (7) het terugboekkenmerk met de terugboekdatum.

## Stap 4 — Reviewchecklist

- [ ] Debet is gelijk aan credit
- [ ] Juiste periode (`jjjjMM`), en de periode is nog open
- [ ] Rekeningnummers bestaan en passen bij de transactie
- [ ] Bedragen rekenkundig juist en onderbouwd
- [ ] Omschrijving specifiek genoeg voor de accountant
- [ ] Kostenplaats, afdeling en projectcodering kloppen
- [ ] Behandeling consistent met vorige perioden en met het waarderingsbeleid
- [ ] Terugboeking juist ingesteld (reserveringen boeken terug)
- [ ] Onderbouwing bijgevoegd of met verwijzing opgenomen
- [ ] Bedrag valt binnen jouw bevoegdheid
- [ ] Geen dubbele post van een bestaande boeking
- [ ] Ongebruikelijke of grote bedragen zijn toegelicht

### Bevoegdheden

| Soort post | Grensbedrag | Goedkeurder |
|---|---|---|
| Vaste, terugkerende post | elk bedrag | Accounting manager |
| Incidentele/handmatige post | < grensbedrag 1 | Accounting manager |
| Incidentele/handmatige post | tussen grens 1 en 2 | Controller |
| Incidentele/handmatige post | > grensbedrag 2 | CFO / VP Finance |
| Consolidatiepost (top-side) | elk bedrag | Controller of hoger |
| Correctie buiten de periode | elk bedrag | Controller of hoger |

De bron noemt hier dollargrenzen; vul de grensbedragen in zoals ze in de bevoegdhedenmatrix van JBT Marel staan en verzin ze niet zelf.

## Veelvoorkomende fouten

| Fout | Waar je op let |
|---|---|
| Post niet in balans | Debet ≠ credit; handmatige posten altijd natellen |
| Verkeerde periode | Boeking in een gesloten of verkeerde periode |
| Debet en credit omgedraaid | Teken gecontroleerd tegen de verwachte richting |
| Dubbele boeking | Zoek de omschrijving/het bedrag eerst op in SAP |
| Verkeerde rekening | Vooral bij op elkaar lijkende rekeningnummers |
| Terugboeking vergeten | Reservering boekt niet terug → kosten dubbel |
| Verouderde reservering | Terugkerende reservering niet aangepast aan gewijzigde situatie |
| Verdachte ronde bedragen | Bedrag als € 50.000,00 zonder onderliggende berekening |
| Verkeerde valutakoers | Vreemde valuta met de koers van de verkeerde datum |
| Intercompany niet geëlimineerd | Post tussen entiteiten zonder tegenboeking |
| Activeren versus kosten nemen | Kosten die geactiveerd hadden moeten worden, of andersom |
| Periodeafgrenzing (cut-off) | Boeking in de verkeerde periode op basis van lever- of prestatiedatum |

## Stap 5 — Opleveren

Lever altijd vijf dingen op:

1. De opgemaakte journaalpost in de tabel hierboven.
2. De berekeningen eronder, met de gebruikte bron (PO, contract, staat, `LCV_KPTM`-export).
3. Een vergelijking met dezelfde post van de vorige periode, als die beschikbaar is.
4. De punten die je hebt gemarkeerd voor review of navraag.
5. De manier van boeken: handmatig in SAP of als uploadbestand, met de kolomindeling die SAP verwacht.
