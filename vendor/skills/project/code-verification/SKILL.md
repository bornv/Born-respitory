---
name: code-verification
description: Beoordeel code, diffs, tests en releasegereedheid met verse controleerbare resultaten. Gebruik bij code review, een bugfix valideren, tests beoordelen of software controleren zonder opdracht tot wijzigen.
metadata:
  origin: repository-project-skill
---

# Code controleren

## Afbakening

Lees de opdracht en AGENTS.md. Werk standaard alleen-lezen: een review is geen
opdracht om productiecode te repareren. Gebruik code-work zodra de gebruiker
ook wijzigingen vraagt. Voer bestaande controles uit; voeg geen nieuwe tests
toe zonder opdracht wanneer uitsluitend een beoordeling is gevraagd.

## Controle

1. Leg eisen en acceptatiecriteria vast en lees de actuele diff plus aanroepers.
2. Onderzoek invoer, foutpaden, bestanden, netwerkgrenzen en uitvoer. Let op
   stille standaardwaarden, verkeerd toegepaste eenheden en foutmeldingen die
   ten onrechte succes suggereren.
3. Kies bestaande controles die het gewijzigde gedrag daadwerkelijk raken.
   Inspecteer testverwachtingen: een kopie van de berekening uit productiecode
   is geen onafhankelijke controle van dezelfde berekening.
4. Draai passende tests, build en runtimecontroles. Gebruik webapp-testing voor
   browsergedrag, metaalmaat-rekenregels voor omrekeningen en windows-release
   voor de Windows-app en ZIP. Lees eerst de relevante skillingang.
5. Leg per eis vast: bevestigd, gedeeltelijk gecontroleerd, niet gecontroleerd
   of gefaald. Onderbouw met het verse commando/resultaat en de geteste versie.

## Bevindingen

Rapporteer aantoonbare problemen eerst, met bestand/locatie, trigger, gevolg en
reproduceerbaar bewijs. Onderscheid productfout, testfout en omgevingsbeperking.
Zeg expliciet wanneer geen bevindingen zijn gevonden en welke materiële
controles niet konden worden uitgevoerd. Beschrijf een risicohypothese als
hypothese, niet als aangetoonde fout.

## Grenzen van bewijs

Een testresultaat van een vorige commit is niet zonder meer geldig voor deze
diff. Een geldige ZIP is geen bewijs dat de exe start. Een startende app bewijst
niet dat Excelimport, conversie en export werken. Een interne bestandspadlink
is geen downloadbare bijlage. Verifieer een aangeboden externe download apart.
