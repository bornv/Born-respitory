---
name: runbook
description: Maak en volg uitvoerbare runbooks voor terugkerende Power BI-, Oracle-, gateway- en energieautomatiseringsproblemen met bewijs, verwachte uitkomst en rollback.
license: Internal project knowledge
---

# Runbook

Een runbook beschrijft een herhaalbare handeling, geen losse tip. Gebruik per
procedure steeds dezelfde volgorde:

1. **Doel en trigger:** welk symptoom, welke omgeving en welke impact.
2. **Voorwaarden:** rechten, betrokken systemen, laatste succesvolle run,
   Request ID, tijdzone, back-up of export en stopcriteria.
3. **Baseline:** leg vóór de wijziging status, foutmelding, duur, aantallen en
   relevante metingen vast.
4. **Stappen:** kleine, genummerde acties met controle na elke stap. Vermeld
   expliciet of de stap alleen diagnose is of een productie-instelling wijzigt.
5. **Verwachte uitkomst:** wat moet zichtbaar veranderen en binnen welke tijd.
6. **Rollback:** exacte terugzetstap, voorwaarden om terug te zetten en hoe de
   oude toestand wordt gecontroleerd.
7. **Afronding:** bewijs, resterende risico's, eigenaar, datum en escalatiepad.

Voor Power BI/Oracle/gateway neem je refreshduur, Request ID, ORA-fout,
gatewaystatus, query- en modelmetingen vóór en na de wijziging op. Voor
energieautomatisering neem je minimum-SoC, reserve, prijsvenster, actuele
vermogensrichting en een veilige handmatige terugval op. Voer geen live stap
uit zonder bevestigde scope en maak geen aannames over ontbrekende apparaten,
accounts of productiegegevens.
