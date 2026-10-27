---
name: data-context-extractor
description: Leg een controleerbare contextlaag vast voor Power BI- en Penta-data met bronvelden, sleutels, granulariteit, definities, filters en actuele projectafspraken.
license: Internal project knowledge
---

# Data Context Extractor

Gebruik deze skill wanneer een analyse of modelwijziging afhankelijk is van de
betekenis van velden, sleutels of afspraken die niet betrouwbaar uit een vraag
alleen kunnen worden afgeleid.

## Werkwijze

1. Inventariseer de werkelijk aangeleverde PBIP/TMDL/PBIR-bestanden, Power Query,
   SQL, exports en afsprakenlijsten. Noteer bestand, versie, peildatum en bron.
2. Leg per tabel of bron vast: grain, primaire en alternatieve sleutels,
   relaties, datumveld, periodebereik, eenheid, valuta, null- en statusregels,
   refreshmoment en eigenaar.
3. Leg per veld vast: exacte bronnaam, modelnaam, datatype, definitie,
   transformatie, toegestane waarden en bekende uitzonderingen. Behoud de
   spelling van Oracle-, ERP-, SharePoint- en modelnamen.
4. Scheid **bevestigd**, **afgeleid**, **aanname** en **onbekend**. Bij een
   conflict blijven beide bronnen zichtbaar totdat de eigenaar het beslist.
5. Schrijf het resultaat als een compacte contextbijlage met een bronnenlijst,
   open vragen en een wijzigingsdatum. Voeg geen klantregels, wachtwoorden,
   tokens, contractbestanden of volledige productie-exports toe.

## Kwaliteitsgrens

Een contextextractie is geen bewijs dat een join, DAX-meting of refresh werkt.
Laat de gevonden grain, sleutels en definities daarna door `validate-data` en
de passende model- of PBIP-controle toetsen.
