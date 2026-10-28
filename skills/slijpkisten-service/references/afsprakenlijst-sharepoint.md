# Afsprakenlijst (Excel op SharePoint)

Bestand `Slijpkisten_afspraken.xlsx` op `https://jbtmarel.sharepoint.com/sites/LCV-LCVRetouren` (willekeurige bibliotheek/map; het rapport zoekt op bestandsnaam). **Tabel- en kolomnamen niet wijzigen**; nieuwe regels onderaan de tabel toevoegen (tabel groeit mee), daarna vernieuwen.

| Tabblad | Tabel | Kolommen |
|---|---|---|
| Uitleg | — | Instructie |
| Betaalafspraken | `tblBetaalafspraken` | AfspraakId, Klantlocatie, KUNDEN_NR, ERP2025, Klantorder (zonder voorloopnullen), ViaContract, ContractId, Bedrag, Valuta, Termijn (`Per kwartaal` / `Per maand` / `Contract` / `Geen`), BedragTermijnEUR, Startdatum, Einddatum, Robot, Productie, Frequentie, Status (`Actief` telt mee), Opmerking |
| Contracten | `tblContracten` | ContractId, Contractorder (`00xxxx0000`), Klant, Start, Eind, KistStartPeriode (jjjjmm), BedragServiceTabel, **WaardeSlijpservice** |
| ContractKistorders | `tblContractKistorders` | ContractId, Klantorder |
| NietInSlijpmarge (optioneel) | `tblNietInSlijpmarge` | Artikel (volledig nummer of stam vóór de punt) |

Regels:
- Kolommen die het model zelf toevoegt (KUNDEN_NR, Bron, KD_VORGANGS_NR, Afspraak, TermijnVolgorde) mogen in de Excel staan; ze worden eerst verwijderd ("Het veld … bestaat al" voorkomen).
- Ontbreekt `WaardeSlijpservice` of `tblNietInSlijpmarge`: geen fout, wel geen onderscheid (stil!). Controle na vernieuwen: pagina Slijpservice → kolom "Waarde slijpservice" gevuld.
- WaardeSlijpservice = slijpdeel over de **hele looptijd**, overgenomen uit het contract (na korting). Het slijpdeel is niet uit de financedata af te leiden.
- Nieuw contract: regel in tblContracten (start, eind, bedrag, slijpdeel) + kistorders in tblContractKistorders + (indien termijn) regel in tblBetaalafspraken. Automatisch gevonden contracten (oranje) hier aanvullen.

Fouten:
- `405 Method Not Allowed`: deellink (`/:x:/r/…`) als site ingevuld → alleen het site-adres.
- "dynamic data source" in de service: site-URL berekend in M → vaste parameter + `SharePoint.Files(AfsprakenSite, [ApiVersion = 15])`.
- "Afsprakenlijst niet gevonden": bestandsnaam wijkt af van `AfsprakenBestand`.
| KostenUitsluiten | `tblKostenUitsluiten` | Order (zonder voorloopnullen), Periode (jjjjmm, tekst), Bedrag (zoals in het rapport, negatief = kostenverlaging), Reden |
