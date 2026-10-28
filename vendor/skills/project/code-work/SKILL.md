---
name: code-work
description: Wijzig en onderhoud broncode bij functies bouwen, bugs oplossen en refactoren. Gebruik bij softwarewijzigingen; gebruik code-verification bij uitsluitend review of testen.
metadata:
  origin: repository-project-skill
---

# Code wijzigen

Deze repository-lokale projectskill beschrijft de werkwijze voor codewijzigingen.
Hij is zelfstandig en vereist geen externe skillplugin.

## Uitvoering

1. Lees de toepasselijke AGENTS.md, de huidige status/diff, projectdocumentatie,
   pakketmanifesten en bestaande tests. Houd gebruikerswijzigingen intact.
2. Formuleer het gewenste gedrag en concrete acceptatiecriteria. Bepaal welke
   bestanden en publieke interfaces binnen de opdracht vallen.
3. Reproduceer een bug vóór een wijziging. Volg gegevens van invoer tot resultaat
   om de oorzaak vast te stellen; gebruik systematic-debugging indien nodig.
4. Bouw een kleine werkende wijziging met de bestaande architectuur. Vermijd
   extra frameworks, afhankelijkheden en herstructurering zonder aanleiding.
5. Verifieer de wijziging met de kleinste passende bestaande controle. Voeg
   alleen een gerichte test toe wanneer deze betekenisvol nieuw gedrag of een
   regressierisico bewijst; kopieer niet de implementatie als testverwachting.
6. Voer daarna passende projecttests en, indien relevant, de build uit. Noteer
   commando, exitstatus en beperkingen. Controleer de uiteindelijke diff.
7. Meld wat is veranderd, waarom, hoe het is gecontroleerd en wat onbewezen is.

Een opdracht om te coderen verleent niet vanzelf toestemming voor publiceren,
een release of wijzigingen aan externe systemen. Gebruik toestemming die al in
de sessie is gegeven en vraag niet opnieuw om dezelfde toestemming.

## Metaalmaat

Zoek de actuele appmap en branch; de app kan op metaalmaat-windows staan terwijl
main alleen de skillcatalogus bevat. Lees package.json voor actuele commando's.
Gebruik metaalmaat-rekenregels voor eenheden, dichtheid en Excel-interpretatie;
gebruik windows-release voor een Windows-uitgave. Excelprijzen komen van de
leverancier uit het ingevulde bestand; voeg geen marktprijsfeed toe tenzij dat
expliciet wordt gevraagd. Lees ook de kleine ingangen van webapp-testing en
code-verification wanneer de opdracht UI-controles of een onafhankelijke review
nodig maakt.

## Overdracht

Beschrijf het resultaat en relevante controles. Een geslaagde Linux-test of
Windows-build bewijst niet dat de app interactief op Windows is gestart.
