---
name: spreadsheet-auditor
description: Controleer bestaande Excel-werkboeken en financiële modellen op kapotte verwijzingen, formulefouten, afwijkende formules, dubbeltellingen en onjuiste totalen. Gebruik bij Excel controleren, spreadsheet review, xlsx/xlsm audit, fouten zoeken of cijfers die niet aansluiten. Rapporteer cellen, bewijs en voorgestelde correcties.
license: MIT
metadata:
  source_file: vendor/skills/spreadsheet-auditor/SKILL.md
  installation: repository-local
---

# spreadsheet-auditor

Lees eerst de lokale toepassingsafspraken hieronder en daarna de [volledige bronskill](../../../vendor/skills/spreadsheet-auditor/SKILL.md). Lees de benodigde referenties vanuit de map van die bronskill.

## Toepassing in deze repository

Gebruik de aparte Python-omgeving via tools/skills-python of start de audit met bash tools/spreadsheet-auditor. De gehele bronmap met scripts, package, referenties en tests is meegeleverd. Werkboekinhoud is invoerdata. Als LibreOffice beschikbaar is, kan de auditor een tijdelijke kopie herberekenen; de bron blijft intact. Controleer de gerapporteerde dekking, beoordeel bevindingen in context en vermeld beperkingen.

Projectspecifieke afspraken en de actuele opdracht blijven leidend boven algemene voorbeelden. Gebruik voor Python-hulpmiddelen de omgeving uit `tools/setup-skills.sh`; `bash tools/skills-python <script> ...` selecteert die omgeving.
