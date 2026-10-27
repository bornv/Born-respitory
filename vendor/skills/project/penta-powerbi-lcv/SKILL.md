---
name: penta-powerbi-lcv
description: Projectcontext voor het LCV/Penta Power BI- en PBIP-werk rond Slijpkisten Service, Oracle LCV_DATA, afspraken, refreshdiagnose, marge en oplevering.
license: Internal project knowledge
---

# Penta Power BI LCV

Dit is de ontbrekende projectcontext waar de Slijpkisten/Penta-werkwijze naar
verwijst. Lees alleen de relevante referentie en markeer bron, peildatum en
zekerheid. De repository bevat geen productie-PBIP, klantbestand, contract-PDF
of Oracle-export.

| Onderwerp | Referentie |
|---|---|
| Bronvelden, codes en Oracle/Penta-betekenis | `references/bronnen-lcv-penta.md` |
| Kisten, zendingen, robots, revisie en marge | `references/bedrijfsregels.md` |
| Model, metingen en lineage | `references/model-en-metingen.md` |
| Afsprakenlijst en SharePoint-velden | `references/afsprakenlijst-sharepoint.md` |
| Refresh, gateway, Oracle en dataflow | `references/refresh-en-performance.md` |
| PBIP/TMDL/PBIR wijzigen en opleveren | `references/werkwijze-pbip.md` |
| Afstemming op LCV-standaard en naamgeving | `references/lcv-werkwijze-afstemming.md` |

De vaste bedrijfsregels in deze referenties zijn projectkennis, geen bewijs dat
een actuele bron of model nog hetzelfde is. Gebruik `data-context-extractor`,
`validate-data` en `pbip-delivery-check` voor actuele bevestiging. Gebruik
`runbook` voor terugkerende incidenten. Meld altijd wat lokaal is gecontroleerd
en wat alleen in Power BI Desktop, de service, Oracle of de gateway kan worden
getest.
