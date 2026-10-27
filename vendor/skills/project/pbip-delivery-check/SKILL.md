---
name: pbip-delivery-check
description: Controleer vóór oplevering of een Power BI PBIP-project, TMDL-model, PBIR-rapport en projectverwijzingen samenhangend, reproduceerbaar en vrij van vertrouwelijke bestanden zijn.
license: Internal project knowledge
---

# PBIP Delivery Check

Voer deze controle uit op een kopie van de oplevermap. Wijzig geen model- of
rapportbestanden tijdens de controle.

## Oplevercontrole

- Controleer de `.pbip`-verwijzing, SemanticModel- en Report-mappen,
  `definition`-bestanden, PBIR-pagina's, TMDL-tabellen, relaties en expressions.
- Controleer dat elke modeltabel, kolom, meting, relatie en rapportverwijzing
  bestaat en dat hernoemingen overal zijn doorgevoerd.
- Controleer Power Query/M, SQL-bronvelden, queryvolgorde, datatypen,
  parameters, refreshinstellingen en eventuele gateway-verwijzingen.
- Controleer versie, `LEESMIJ`, bronlijst, wijzigingsoverzicht, reproduceerbare
  uitpak- en openingsinstructies en een lege doelmap voor de eerste test.
- Controleer op secrets, klantdata, `.pbix`-bestanden, lokale paden en
  tijdelijke exports. Deze horen niet in Git.
- Leg per controle vast: pass/fail, bewijs, toolversie, peildatum en wat nog
  alleen in Power BI Desktop, de service, Oracle of de gateway kan worden getest.

Voor het LCV/Penta-project lees je ook de referenties onder
`../penta-powerbi-lcv/references/`, in het bijzonder `werkwijze-pbip.md`.
