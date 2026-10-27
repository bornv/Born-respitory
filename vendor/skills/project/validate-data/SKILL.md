---
name: validate-data
description: Controleer of Power BI-, SQL- en operationele analyses inhoudelijk aansluiten zonder dubbeltellingen, periodefouten, filterdrift of niet-aansluitende totalen.
license: Internal project knowledge
---

# Validate Data

Gebruik deze skill vóór een conclusie, modelwijziging of oplevering. Werk met
een reproduceerbare controle en bewaar de gebruikte peildatum, filters en
bronversies.

## Controlevolgorde

1. Bevestig de grain van elke bron en controleer primaire sleuteluniciteit,
   nullsleutels en onverwachte many-to-many-relaties.
2. Test joins op rijvermenigvuldiging: vergelijk rijen en bedragen vóór en na
   iedere join, en controleer een steekproef met bekende sleutel.
3. Controleer periodegrenzen, kalenderrelaties, tijdzones, lopende en
   afgesloten perioden, YTD/maandfilters en uitsluitingen.
4. Vergelijk totalen op drie niveaus: bron, tussenresultaat en eindrapport.
   Splits verschillen uit naar ontbrekend, dubbel, geannuleerd, afgerond,
   valuta- of tekenverschil.
5. Controleer dat slicers, filtercontext, statusregels, valuta en eenheden
   hetzelfde betekenen in query, model, DAX en rapport.
6. Leg bevindingen vast met verwachting, feitelijke uitkomst, bewijs, impact,
   reproduceerstappen en een expliciete onzekerheid. Claim geen inhoudelijke
   correctheid wanneer de onderliggende bron niet beschikbaar is.

Gebruik `data-context-extractor` voor ontbrekende definities en
`power-bi-performance-troubleshooting` wanneer een verschil samenvalt met
refresh-, gateway- of querygedrag.
