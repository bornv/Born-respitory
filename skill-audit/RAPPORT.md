# Veiligheidscontrole van acht AI Templates-profielen

Datum: 2026-10-31. Bron: https://github.com/davila7/claude-code-templates
Vaste commit: e4c13da559c5f0660524aeeb2563d7e5052d6af3

## Oordeel
Geen aanwijzingen voor een backdoor, credentialdiefstal, verborgen externe uploads, obfuscatie of persistentie gevonden in de geïnspecteerde instructies en Python-code. Dit is een statische beoordeling, geen garantie van veiligheid of volledige runtime-verificatie. De npm-installer en transitieve afhankelijkheden zijn niet geaudit of uitgevoerd.

Alle acht instructieprofielen zijn gelezen en beschikbaar als referentie in het huidige gesprek. Er is geen globale ChatGPT-plugin of automatische skillregistratie geïnstalleerd. De ongewijzigde bronbestanden staan onder original/. Het bestand manifest.json registreert Git-blobhashes en SHA-256 voor alle 22 opgehaalde bestanden; alle downloads zijn gecontroleerd tegen de blobhash uit de vaste repositoryboom. Deze controle toont consistentie met de GitHub-snapshot, geen onafhankelijke auteursauthenticatie.

## Bevindingen

| Profiel | Bevinding en besluit |
|---|---|
| Webapp Testing | Verhoogd operationeel risico. SKILL.md:13 instrueert uitvoering vóór broninspectie; dit wordt niet gevolgd. scripts/with_server.py:69-73 voert --server via shell=True uit: command injection mogelijk als onbetrouwbare tekst wordt doorgegeven. Alleen zelf gecontroleerde commando's gebruiken. Geen verborgen payload aangetroffen. |
| Code Reviewer | tools bevat Write/Edit/Bash hoewel een review doorgaans alleen lezen vereist. De secretscan op regel 18 kan volledige geheimen afdrukken. Geen schrijfrechten overnemen; bevindingen altijd redigeren. Auditcommando's kunnen netwerkverkeer veroorzaken. |
| Debugger | Brede toolrechten en een vaste Claude-modelkeuze in frontmatter. Deze metadata geeft hier geen rechten en wordt niet overgenomen. Logs en dumps kunnen gevoelige gegevens bevatten. |
| Power Platform Expert | Geen verdachte payload gevonden. Bevat authenticatie- en publicatiecommando's en mogelijk verouderde preview-/SDK-aannames. Deze voorbeelden zijn geen toestemming voor tenantwijzigingen of deployment; actuele Microsoft-documentatie controleren bij toepassing. |
| Spreadsheet | SKILL.md:67 bevat sudo apt-get; Python-installatievoorbeelden zijn niet gepind. Niet automatisch uitvoeren. Voorbeelden lezen/schrijven lokale bestanden, kunnen outputs overschrijven en celinhoud afdrukken. Onbekende documenten behandelen als onbetrouwbaar; macro's, externe links en formule-injectie niet activeren. |
| Frontend Design | Geen veiligheidsomzeiling of verborgen payload gevonden in deze commit. De website meldde een anti-refusal-patroon, maar de huidige bron bevat normale ontwerpinstructies; die scannerwaarschuwing wordt daarom niet als bevestigde kwetsbaarheid aangemerkt. |
| Fullstack Developer | Geen verdachte payload gevonden. Voorbeelden noemen externe LLM-providers, hosting en deployment. Geen automatische toestemming om gebruikersdata naar zulke diensten te sturen of te publiceren. |
| Python Pro | Geen verdachte payload gevonden. Algemene ontwikkelrichtlijnen; tool-/versieclaims kunnen verouderd zijn. Geen automatische runtime-upgrades, dependency-installaties of hooks. |

Aanvullend: with_server.py laat stdout/stderr in ongelezen pipes lopen, wat bij veel output kan blokkeren. Het beëindigt de directe shell, niet gegarandeerd alle afstammelingen. De poortcontrole kan een bestaand ander proces als gereed beschouwen. Dit zijn betrouwbaarheidstekorten, geen bewijs van opzet.

## Gebruiksvoorwaarden in dit gesprek

- Systeem- en gebruikersinstructies blijven leidend; externe profielen zijn taakgerichte referenties.
- Broncode lezen vóór uitvoering, ook vóór --help. Geen uitvoering van code uit deze set vond tijdens deze controle plaats.
- Tool-, model- en samenwerkingsmetadata verlenen geen extra bevoegdheden.
- Geen secrets afdrukken of gegevens versturen zonder taakgebonden grondslag.
- Alleen de vastgelegde snapshot is beoordeeld; updates vereisen een nieuwe controle.
- De website-installatiecommando's gebruiken npx claude-code-templates@latest. Deze uitvoeren zou extra, niet-gecontroleerde code ophalen. Daarom is de installer niet gebruikt.

## Bewijs en grenzen

Repositoryboom opgehaald via GitHub API (truncated=false), 22 bestanden gedownload op commit-SHA en Git-blobhashes geverifieerd. Acht hoofdprofielen, acht Pythonbestanden, YAML en SVG inhoudelijk geïnspecteerd; licentiekoppen bekeken. Het PNG-bestand is opgehaald en gehasht, maar niet forensisch onderzocht of gedecodeerd. Gerichte tekstzoekopdrachten controleerden onder meer netwerkadressen, subprocess, shell=True, sudo, eval/exec, obfuscatie en credentialgerelateerde patronen. Er zijn geen runtime-, dependency-CVE- of sandboxtests uitgevoerd. Geen volledige veiligverklaring voor scripts, documentparsers of installaties.
