---
name: home-assistant-best-practices
description: Gebruik Home Assistant-best practices voor automatiseringen, scripts, helpers, sensoren, Jinja, dashboards, blueprints, entiteiten en veilige configuratiewijzigingen. Lees deze skill bij Home Assistant-werk en raadpleeg de passende referenties voor de versie van de installatie.
license: MIT
metadata:
  source_file: .claude/skills/home-assistant-best-practices/SKILL.md
  installation: repository-local
---

# home-assistant-best-practices

Lees eerst de lokale toepassingsafspraken hieronder en daarna de [volledige bronskill](../../../.claude/skills/home-assistant-best-practices/SKILL.md). Lees de benodigde referenties vanuit de map van die bronskill.

## Toepassing in deze repository

De bestaande Claude-skill is bijgewerkt naar upstreamversie 53. Houd rekening met de Home Assistant-versie van het doelsysteem. Lees voor wijzigingen aan bestaande entiteiten of afhankelijkheden de safe-refactoring-referentie. De installatie van deze skill wijzigt geen live Home Assistant-configuratie.

Projectspecifieke afspraken en de actuele opdracht blijven leidend boven algemene voorbeelden. Gebruik voor Python-hulpmiddelen de omgeving uit `tools/setup-skills.sh`; `bash tools/skills-python <script> ...` selecteert die omgeving.
