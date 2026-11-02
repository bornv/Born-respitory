---
name: finance-maandafsluiting
description: "De maandafsluiting plannen en bewaken: afsluitkalender opstellen, closing checklist per dag (voorbereiding en dag 1 t/m dag 5), taken en afhankelijkheden in volgorde zetten, kritiek pad bepalen, status bijhouden per taak en eigenaar, blokkades signaleren, afsluitstatistieken volgen en knelpunten oplossen met een terugblik. Triggers: maandafsluiting, periodeafsluiting, afsluitkalender, closing checklist, close calendar, dag 1 t/m dag 5, T+1, soft close, hard close, periode afsluiten, status bijhouden, wie doet wat bij de afsluiting. Voor het aansluiten van rekeningen zelf: finance-reconciliatie."
---

# Finance-maandafsluiting

Gebaseerd op [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (Apache-2.0, © Anthropic): de skill `close-management` uit de finance-plugin, commit `02ffa99`. Vertaald en aangepast aan de Nederlandse praktijk.

Deze skill helpt bij het werk maar geeft geen fiscaal, accounting- of auditadvies; laat uitkomsten door een bevoegde collega of accountant controleren.

## Context bij JBT Marel

- **Bronsysteem**: SAP. Daar lopen de subadministraties, de boekingen en het afsluiten (locken) van de periode.
- **Resultatendata**: de resultatencijfers haal je via de Oracle-view `LCV_KPTM` in schema `LCV_DATA`; die gebruik je voor de analyse over perioden heen, niet om de periode af te sluiten.
- **Rapportage**: Power BI voor het resultatenoverzicht en de trend, Excel voor werkbladen en de statuslijst.
- **Vastlegging en overleg**: afsluitkalender (close calendar), checklist en dossier op SharePoint; de dagelijkse afstemming en het melden van blokkades loopt via Teams.
- Er is geen koppeling die taken automatisch afvinkt of boekingen uitvoert. Jij doet het werk in SAP; deze skill geeft de volgorde, de afhankelijkheden en de statusvoering.

Bedragen schrijf je als € 1.250,00, datums als dd-mm-jjjj (31-10-2025) en perioden als jjjjMM (202510).

## Checklist per dag

### Voorbereiding (laatste 2-3 werkdagen van de maand)

- [ ] Afsluitkalender en deadlines rondsturen naar alle betrokkenen
- [ ] Afspraken over de knip (cut-off) bevestigen met crediteuren, debiteuren, salarisadministratie en treasury
- [ ] Controleren dat alle deelsystemen normaal draaien (SAP, salarisverwerking, bankkoppeling)
- [ ] Voorlopige bankaansluiting maken, op de laatste dag na
- [ ] Openstaande inkooporders doornemen op mogelijke overlopende posten
- [ ] Controleren dat de salarisverwerking in de afsluittijdlijn past
- [ ] Informatie verzamelen over bekende bijzondere transacties

### Dag 1 (T+1: eerste werkdag na periode-einde)

- [ ] Bevestigen dat alle subadministraties hun periodeverwerking hebben afgerond
- [ ] Overlopende posten crediteuren boeken voor ontvangen maar niet gefactureerde goederen en diensten
- [ ] Salarisboekingen en salarisreservering verwerken
- [ ] Ontvangsten en betalingen tot en met periode-einde vastleggen
- [ ] Intercompany-transacties boeken en bij de tegenpartij bevestigen
- [ ] Bankaansluiting afronden met het definitieve bankafschrift
- [ ] Afschrijvingen op vaste activa draaien
- [ ] Vooruitbetaalde kosten amortiseren

### Dag 2 (T+2)

- [ ] Omzetverantwoording en correcties op vooruitontvangen bedragen boeken
- [ ] Resterende overlopende posten boeken
- [ ] Aansluiting subadministratie debiteuren afronden
- [ ] Aansluiting subadministratie crediteuren afronden
- [ ] Voorraadcorrecties vastleggen
- [ ] Herwaardering vreemde valuta boeken
- [ ] Beginnen met de aansluitingen van de balansrekeningen

### Dag 3 (T+3)

- [ ] Alle balansaansluitingen afronden
- [ ] Correctieboekingen uit de aansluitingen verwerken
- [ ] Intercompany-aansluiting en eliminatieboekingen afronden
- [ ] Voorlopige proefbalans en resultatenrekening draaien
- [ ] Eerste verschillenanalyse op de resultatenrekening
- [ ] Materiële verschillen uitzoeken en oplossen

### Dag 4 (T+4)

- [ ] Belastingposten boeken (winstbelasting, btw, lokale heffingen)
- [ ] Verloopoverzicht eigen vermogen afronden
- [ ] Alle boekingen definitief maken: voorlopige afsluiting (soft close)
- [ ] Concept-jaarrekeningoverzichten maken (resultaat, balans, kasstroom)
- [ ] Uitgebreide verschillenanalyse met toelichtingen schrijven
- [ ] Bespreking van cijfers en kengetallen met het management

### Dag 5 (T+5)

- [ ] Laatste correcties uit de managementbespreking boeken
- [ ] Cijfers definitief maken: definitieve afsluiting (hard close)
- [ ] Periode in SAP afsluiten
- [ ] Rapportagepakket verspreiden naar de belanghebbenden
- [ ] Prognose bijwerken op basis van de werkelijke cijfers
- [ ] Terugblik houden en verbeterpunten noteren

## Taken en afhankelijkheden

Taken zijn gegroepeerd naar wat af moet zijn voordat de volgende groep kan beginnen.

| Niveau | Taken | Wacht op |
|---|---|---|
| 1 | Ontvangsten en betalingen vastleggen, bankafschrift ophalen, salarisverwerking en -reservering, afschrijvingen draaien, vooruitbetaalde kosten amortiseren, overlopende posten crediteuren voorbereiden, intercompany boeken | Niets; kan direct op T+1 starten |
| 2 | Bankaansluiting, omzetverantwoording, aansluiting debiteuren, aansluiting crediteuren, herwaardering vreemde valuta, resterende overlopende posten | Niveau 1 |
| 3 | Alle balansaansluitingen, intercompany-aansluiting, correctieboekingen uit de aansluitingen, voorlopige proefbalans | Niveau 2 |
| 4 | Belastingposten, verloop eigen vermogen, consolidatie en eliminaties, concept-overzichten, eerste verschillenanalyse | Niveau 3 |
| 5 | Managementbespreking, laatste correcties, definitieve afsluiting en periodeslot, rapportagepakket, prognose bijwerken | Niveau 4 |

### Kritiek pad

Het kritieke pad bepaalt hoe kort de afsluiting op zijn best kan zijn:

```
Boekingen bank/crediteuren/debiteuren → aansluiting subadministraties →
  balansaansluitingen → belastingposten → concept-overzichten →
  managementbespreking → definitieve afsluiting
```

Korter maken doe je zo:

1. Automatiseer de taken van niveau 1 (afschrijving, amortisatie, vaste overlopende posten) in SAP.
2. Sluit rekeningen door de maand heen alvast aan in plaats van alles op periode-einde.
3. Laat onafhankelijke aansluitingen parallel lopen in plaats van achter elkaar.
4. Spreek harde deadlines af en maak duidelijk wat er gebeurt als een aanlevering te laat is.
5. Gebruik vaste sjablonen zodat voorbereiden minder tijd kost.

## Status bijhouden

Houd per taak de volgende velden bij in de statuslijst op SharePoint:

| Taak | Eigenaar | Deadline | Status | Blokkade | Opmerking |
|---|---|---|---|---|---|
| [taaknaam] | [persoon of rol] | T+2 | In behandeling | [wat blokkeert] | [toelichting] |

| Status | Betekenis |
|---|---|
| Niet gestart | Nog niet begonnen, mogelijk wachtend op een voorliggende taak |
| In behandeling | Er wordt actief aan gewerkt |
| Klaar | Af en gecontroleerd of goedgekeurd |
| Geblokkeerd | Kan niet verder door een afhankelijkheid, ontbrekende data of een probleem |
| Risico | Loopt, maar de deadline komt in gevaar |

### Dagelijks statusoverleg

Houd tijdens de afsluiting elke dag een kort overleg van een kwartier, bijvoorbeeld in Teams:

1. Loop de statuslijst langs en markeer de taken die achterlopen.
2. Benoem de blokkades die voortgang tegenhouden.
3. Verdeel werk opnieuw of escaleer de blokkade zodat die snel weg is.
4. Beoordeel bij taken met risico wat dat betekent voor de einddatum van de afsluiting.

### Statistieken over de tijd

| Kengetal | Definitie | Doel |
|---|---|---|
| Doorlooptijd afsluiting | Werkdagen van periode-einde tot definitieve afsluiting | Omlaag |
| Correcties na voorlopige afsluiting | Boekingen die tijdens de managementbespreking nog zijn verwerkt | Zo weinig mogelijk |
| Taken te laat | Taken die na hun deadline klaar waren | Nul |
| Uitzoekposten uit aansluitingen | Openstaande posten die onderzoek vroegen | Omlaag |
| Correcties achteraf | Fouten die na de afsluiting zijn gevonden | Nul |

## Afsluitkalender in het kort

| Dag | Belangrijkste werk | Wie |
|---|---|---|
| **T+1** | Bank- en kasboekingen, salaris, overlopende posten crediteuren, afschrijving, amortisatie, intercompany | Financieel medewerkers, salarisadministratie |
| **T+2** | Omzetverantwoording, resterende overlopende posten, aansluiting debiteuren/crediteuren/vaste activa, herwaardering valuta | Financieel medewerkers, treasury |
| **T+3** | Balansaansluitingen, intercompany-aansluiting, eliminaties, voorlopige proefbalans, eerste verschillenanalyse | Financiële administratie, consolidatie |
| **T+4** | Belastingposten, eigen vermogen, concept-overzichten, uitgebreide verschillenanalyse, managementbespreking | Fiscaal, controller, FP&A |
| **T+5** | Laatste correcties, definitieve afsluiting, periodeslot, rapportagepakket, prognose, terugblik | Controller, FP&A, finance-leiding |

### Versnelde afsluiting (doel: 3 dagen)

| Dag | Belangrijkste werk |
|---|---|
| **T+1** | Alle boekingen verwerkt (automatisch en handmatig), alle aansluitingen subadministraties, bankaansluiting, intercompany-aansluiting, voorlopige proefbalans |
| **T+2** | Alle balansaansluitingen, belastingposten, consolidatie, concept-overzichten, verschillenanalyse, managementbespreking |
| **T+3** | Laatste correcties, definitieve afsluiting, rapportagepakket, prognose bijwerken |

Dat lukt alleen met geautomatiseerde terugkerende boekingen, aansluitingen die door de maand heen al gedaan zijn, automatische intercompany-eliminatie, voorbereiding die vóór periode-einde af is, duidelijke eigenaren met weinig overdrachtsmomenten, en deelsystemen die (bijna) realtime aansluiten op SAP.

## Knelpunten oplossen

| Knelpunt | Oorzaak | Aanpak |
|---|---|---|
| Overlopende posten crediteuren te laat | Wachten op bevestiging van uitgaven door de afdeling | Doorlopend schatten; harde knip-deadline afspreken |
| Veel handmatige boekingen | Terugkerende boekingen worden elke maand met de hand gemaakt | Vaste boekingen automatiseren in SAP |
| Aansluitingen duren lang | Elke maand opnieuw vanaf nul beginnen | Doorlopend aansluiten tijdens de maand |
| Intercompany loopt vast | Wachten op de tegenpartij | Matching automatiseren; strakkere deadlines afspreken |
| Veel wijzigingen uit de managementbespreking | Grote correcties komen pas daar boven water | Eerdere eigen review; team ruimte geven om issues zelf te signaleren |
| Onderbouwing ontbreekt | Documentatie wordt pas bij de afsluiting verzameld | Stukken gedurende de maand vastleggen op SharePoint |

### Terugblik na elke afsluiting

1. Wat ging goed en willen we zo houden?
2. Wat duurde langer dan verwacht en waarom?
3. Welke blokkades waren er en hoe voorkomen we die volgende keer?
4. Zaten er verrassingen in de cijfers die we eerder hadden moeten zien?
5. Wat kunnen we volgende maand automatiseren of vereenvoudigen?

## Let op bij herkomst van de bron

De bron komt uit de Amerikaanse praktijk (US GAAP/SOX; onder Nederlandse regels kan dit afwijken). Dat zie je terug in de nadruk op een formele voorlopige en definitieve afsluiting met vastgelegde review- en goedkeuringsstappen, en in de belastingposten per afsluiting. Welke stappen, termijnen en vastleggingseisen voor JBT Marel gelden, volgt uit de eigen administratieve organisatie, de groepsrapportage-afspraken en de afspraken met de accountant. Neem de dagindeling hierboven als vertrekpunt, niet als norm.
