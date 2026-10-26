---
name: data-quality-frameworks
description: 'Ontwerp controles op datakwaliteit: volledigheid, unieke sleutels, toegestane waarden, onderlinge consistentie en actualiteit. Gebruik bij datakwaliteit, data contracts, Great Expectations, dbt tests of validatie van rapportagedata.'
license: MIT
metadata:
  source_file: vendor/skills/wshobson/data-quality-frameworks/SKILL.md
  installation: repository-local
---

# data-quality-frameworks

Lees eerst de lokale toepassingsafspraken hieronder en daarna de [volledige bronskill](../../../vendor/skills/wshobson/data-quality-frameworks/SKILL.md). Lees de benodigde referenties vanuit de map van die bronskill.

## Toepassing in deze repository

De bron bevat generieke Great Expectations/dbt-patronen. Kies controles die bij het werkelijke platform passen; installeer deze frameworks alleen als de concrete taak ze nodig heeft. Voor Slijpkisten gelden de bestaande bedrijfsregels: begin met geladen data en voeg niet automatisch nieuwe Penta-bron- of metadataqueries toe.

Projectspecifieke afspraken en de actuele opdracht blijven leidend boven algemene voorbeelden. Gebruik voor Python-hulpmiddelen de omgeving uit `tools/setup-skills.sh`; `bash tools/skills-python <script> ...` selecteert die omgeving.
