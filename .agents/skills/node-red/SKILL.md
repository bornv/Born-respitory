---
name: node-red
description: Ontwerp en controleer Node-RED-flows, flow-JSON, timers, contextopslag, MQTT, foutafhandeling en Home Assistant-websocketnodes. Gebruik bij Node-RED, visuele automatisering, flow aanpassen of flowdebugging.
license: MIT
metadata:
  source_file: vendor/skills/aurora-smart-home/node-red/SKILL.md
  installation: repository-local
---

# node-red

Lees eerst de lokale toepassingsafspraken hieronder en daarna de [volledige bronskill](../../../vendor/skills/aurora-smart-home/node-red/SKILL.md). Lees de benodigde referenties vanuit de map van die bronskill.

## Toepassing in deze repository

Controleer eerst de Node-RED-versie, geïnstalleerde palettes en nodes van het doelsysteem. De bron richt zich op Node-RED 4.x en HA-websocketnodes v0.80+; dit bewijst geen compatibiliteit met Cerbo GX/Venus OS of Victron-nodes. Verifieer nodebenamingen en schema’s aan het daadwerkelijk geïnstalleerde pakket, vervang bestaande nodes niet blind op basis van de migratietabel. De gedeelde Aurora-documentatie is naast de Node-RED-map meegeleverd. Gebruik voor een losse taak de zelfstandige werkwijze; de aanwezigheid van Aurora-documentatie start geen agentteam of deploy.

Projectspecifieke afspraken en de actuele opdracht blijven leidend boven algemene voorbeelden. Gebruik voor Python-hulpmiddelen de omgeving uit `tools/setup-skills.sh`; `bash tools/skills-python <script> ...` selecteert die omgeving.
