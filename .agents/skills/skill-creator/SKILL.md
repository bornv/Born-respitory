---
name: skill-creator
description: Maak, verbeter en evalueer agent-skills met testvragen, beoordelingscriteria en regressiecontroles. Gebruik bij SKILL.md, skill maken, skill uitbreiden, skill testen, benchmarks en onjuiste skillselectie.
license: Apache-2.0
metadata:
  source_file: vendor/skills/anthropics/skill-creator/SKILL.md
  installation: repository-local
---

# skill-creator

Lees eerst de lokale toepassingsafspraken hieronder en daarna de [volledige bronskill](../../../vendor/skills/anthropics/skill-creator/SKILL.md). Lees de benodigde referenties vanuit de map van die bronskill.

## Toepassing in deze repository

Gebruik in Codex de beschikbare tools en voer vergelijkingen sequentieel uit als er geen geschikte agents zijn. De optionele run_eval.py/run_loop.py-hulpmiddelen vereisen een afzonderlijk geïnstalleerde en aangemelde Claude CLI; verwar een ontbrekende CLI niet met een falende skill. Start lokale scripts via `bash tools/skill-creator <scriptnaam_zonder_py> ...`; deze adapter stelt hun vereiste Python-modulepad correct in. De meegeleverde validators, pakketmaker en rapportgeneratoren kunnen hiermee lokaal draaien.

Projectspecifieke afspraken en de actuele opdracht blijven leidend boven algemene voorbeelden. Gebruik voor Python-hulpmiddelen de omgeving uit `tools/setup-skills.sh`; `bash tools/skills-python <script> ...` selecteert die omgeving.
