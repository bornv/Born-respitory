# Oplevering en download

## ZIP-inhoud

- De afgesproken Windows-exe, met juiste productnaam en versie.
- Het actuele Excel-invulformat met instructie voor de leverancier.
- Een korte handleiding: uitpakken, starten, import, prijsbasis, dichtheid en export.
- Eventueel screenshots die duidelijk als voorbeeldgegevens zijn aangeduid.

Controleer de lijst en CRC met een ZIP-tool. Start de uitgepakte exe op Windows
indien beschikbaar. Een portable Electron-app kan de runtime al bevatten;
beoordeel grootte aan de hand van inhoud, niet een arbitraire drempel alleen.

## GitHub

Gebruik releases voor binaries groter dan GitHubs limiet voor normale Gitbestanden.
Een workflow kan op Windows bouwen en een asset publiceren met een tijdelijk
GITHUB_TOKEN en passende contents:write. Laat tests vóór publiceren draaien.
Voeg geen statisch token toe aan de workflow of de distributie.

Wacht op een terminale workflowstatus en state=uploaded van het release-asset.
Controleer vervolgens de browser_download_url. Een interne /workspace-link,
localhost-preview of alleen broncode is geen downloadbaar Windows-pakket.
Zeg niet dat een bestand als bijlage is geleverd als het slechts lokaal bestaat.

## Bewijstabel

| Onderdeel | Vereist bewijs |
|---|---|
| Rekenen en Excel | Verse tests tegen dezelfde commit |
| Windows-build | Geslaagde Windows-buildjob |
| Start en interactie | Uitgevoerde Windows-smoketest met import/export |
| ZIP | Archiefcontrole en bestandsoverzicht |
| Download | Werkende externe URL, juiste bytes en SHA-256 |
| Ondertekening | Controle van de echte digitale handtekening, of expliciet onbekend/afwezig |

Een skill creëert geen Windows-machine, GitHub-rechten of downloadvoorziening.
Meld de beperking en lever de overige aantoonbaar uitvoerbare onderdelen op.
