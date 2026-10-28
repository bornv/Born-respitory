---
name: windows-release
description: Bouw, test, verpak en controleer een Electron Windows-app met downloadbare ZIP op GitHub. Gebruik bij exe, portable app, Windows-release, ZIP versturen, GitHub Actions en een kapotte downloadlink.
metadata:
  origin: repository-project-skill
---

# Windows-release

## Voorbereiden

Lees de actuele package.json, lockfile, desktop-entrypoints en workflow. Gebruik
de bestaande bouwcommando's en juiste GitHub-account/repository/branch. Zoek de
Metaalmaat-app waar hij werkelijk staat; main en metaalmaat-windows kunnen een
verschillende inhoud hebben. Behoud bestaande toegang en publicatieafspraken.
Een release maken vereist toestemming voor publiceren; gebruik de toestemming
die al in de opdracht of sessie gegeven is.

## Bouw en controle

1. Draai de passende reken-, Excel- en opslagtests op de te publiceren commit.
2. Genereer het leveranciersformat uit dezelfde bron. Controleer de dichtheids-
   instructie, getalnotatie, eenheden en voorbeelden in het werkelijke .xlsx.
3. Bouw voor de afgesproken Windows-architectuur. Houd portable exe en installer
   uit elkaar. Installeer geen onnodige systeemonderdelen om een ander type
   pakket te bouwen dan het afgesproken resultaat.
4. Controleer op Windows of de exe start zonder ontbrekende DLL of wit scherm.
   Doorloop Excelimport, omrekening, export, opslaan en annuleren. Controleer
   offline gedrag. Leg vast wanneer interactief testen niet mogelijk was.
5. Lees [oplevering en download](references/oplevering.md) en maak de ZIP met exe,
   leveranciersformat en handleiding. Test de ZIP-integriteit en inhoud.
6. Publiceer alleen de gecontroleerde build. Bewaar commit, job/run, bestandsgrootte
   en SHA-256. Voorkom dat overlappende builds elkaars release-assets vervangen.
7. Controleer de externe download zonder je privésessie wanneer deze publiek
   hoort te zijn: redirects volgen, juiste naam, non-empty ZIP en correcte hash.

## Vertrouwensgrenzen

Behoud contextIsolation, sandbox en uitgeschakelde nodeIntegration in de
renderer. Beperk de preload tot noodzakelijke acties en valideer IPC-afzender,
bestandsnaam, type en omvang. Maak opslagfouten en annuleren zichtbaar.
Stop geen API-tokens, gebruikerswerkboeken of lokale .env/hostingcredentials
in broncode of ZIP. Een digitale handtekening mag alleen als aanwezig worden
gemeld wanneer die werkelijk is gecontroleerd.

## Rapportage

Rapporteer apart: tests, Windows-build, interactief Windows-gebruik, ZIP en
download. Benoem het bewijs per onderdeel; een geslaagde build bewijst de rest
niet. Meld ontbrekende ondertekening en een niet-geteste Windows-start kort.
