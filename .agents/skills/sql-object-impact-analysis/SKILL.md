---
name: sql-object-impact-analysis
description: Analyseer vóór een SQL-wijziging welke tabellen, kolommen, views, procedures, queries en applicaties daarvan afhankelijk zijn. Gebruik bij impactanalyse, afhankelijkheden zoeken, hernoemen, verwijderen of beoordelen of een databasewijziging iets kan breken.
license: MIT
metadata:
  source_file: vendor/skills/awesome-copilot/sql-object-impact-analysis/SKILL.md
  installation: repository-local
---

# sql-object-impact-analysis

Lees eerst de lokale toepassingsafspraken hieronder en daarna de [volledige bronskill](../../../vendor/skills/awesome-copilot/sql-object-impact-analysis/SKILL.md). Lees de benodigde referenties vanuit de map van die bronskill.

## Toepassing in deze repository

Neem bij Power BI ook M-, TMDL-, DAX- en PBIR-verwijzingen mee. Benoem dynamische SQL en niet-beschikbare databronnen als onzeker. Houd bestaande Penta/LCV-bronregels aan; voer voor deze analyse geen schemawijzigingen uit.

Projectspecifieke afspraken en de actuele opdracht blijven leidend boven algemene voorbeelden. Gebruik voor Python-hulpmiddelen de omgeving uit `tools/setup-skills.sh`; `bash tools/skills-python <script> ...` selecteert die omgeving.
