# Model, tabellen en metingen

## Gedeelde M-expressies (niet geladen)
Vanaf versie 21 vervallen: KistBasis, KistOrderLijst, KistKlantLijst, KPTM_Kist, KPTM_Contract, Journaal_Kist, SqlIn, Bronmodus/Dataflow. Nieuw: KistOrdersSQL/KistKlantenSQL/KistRegelsSQL/VanafJournaal (SQL-tekst), NaarDatum, MesRobotLijst. Zie [lcv-werkwijze-afstemming.md](lcv-werkwijze-afstemming.md#bronlaag-één-query-per-penta-bron-vanaf-versie-21).

| Expressie | Doel |
|---|---|
| `OracleServer`, `StartPeriode` (jjjjmm, bv. `202510`), `TransportGegevensbron` (`Oracle` of iets anders = transport uit), `PKLPView`, `PKLPArtikelveld`, `AfsprakenSite`, `AfsprakenBestand` | Parameters |
| `KistBasis` | Unieke kistregels (eigen lichte SQL) — basis voor bijna alles |
| `KistOrderLijst`, `KistKlantLijst` | Lijsten uit KistBasis voor `SqlIn` |
| `KPTM_Lees(sql)`, `KPTM_Kist`, `KPTM_Contract` | KPTM-boekingen op kistorders resp. contractorders |
| `Journaal_Kist` | PAJL-regels van de kistorders (datumfilter in M) |
| `PKLPBron` | Record: PKLP-regels + beschikbaarheid view/kolommen |
| `AfsprakenWerkboek`, `NietInSlijpmarge` | Excel op SharePoint |
| `Opzoek`, `Bevat`, `LeesHoofdafleverbon`, `NaarDatum`, `PentaKolommen`, `PentaViewBestaat` | Hulpfuncties |

## Geladen tabellen
Vanaf versie 20 met prefix: feiten `F `, dimensies `D ` (bv. `F KistKosten`, `D Klanten`, `D KistRegels`); alle metingen in `Calculations`; tabel `Last refresh date`. Namen hieronder zonder prefix; zie [lcv-werkwijze-afstemming.md](lcv-werkwijze-afstemming.md).

| Tabel | Inhoud |
|---|---|
| KistKosten | Alle ISW-boekingen op kistorders met Categorie, CategorieVolgorde, RegelSoort (Slijpronde / Nieuwe kist / Overige regel), Bedrag (kosten positief), Omschrijving. Bevat de meeste metingen. |
| KistRegels | Per kistregel: kisttype, robot, GOB/GVR-datum, Zending, serienummer |
| Kistorders | Kistorder, klant; berekende kolom `Afspraak` (DAX) |
| Klanten | Klanten met slijpkisten |
| Afkeur | WAM-uitgifte van messen op slijprondes, met prijs en omschrijving |
| PO_BM | Inkooporders bij B.M. |
| Facturen | **Berekende tabel** uit KistKosten (Omzet, netto ≠ 0) per order en periode |
| Servicecontracten | tblContracten + automatisch gevonden contracten; WaardeSlijpservice, Bron |
| Slijpservice | PLW/ISW op contractorders met Kostengroep, Artikel, Omschrijving, KUNDEN_NR |
| ContractKistorder | Contract ↔ kistorder (Excel + automatisch) |
| Betaalafspraken, Betaaltermijnen, Omzetplanning | Afspraken, termijnen tot einddatum, planning per maand (Bedrag, BedragRevisie) |
| Robots, Kisttypen, VerwachteKisten, Productie, NC Robots, KlantLand, TransporttariefLand | Tarieven, koppelingen, invoer voor calculatie en nieuw contract |
| Periodes | **Berekende tabel**: maanden van eerste t/m laatste maand in de data (of t/m vandaag), Maandstatus |
| OmzetKlant | Alle 951000 van slijpklanten op elke order (Ordertype) |
| SerienummerControle | Controle GOB/GVR/serienummers |
| Shipping_PKLK, TransportAfleverbonnen, AfleverbonKistregels, TransportZendingen, PKLPControle, TransportBroncontrole | Transport en afleverbonnen |

Relaties o.a.: KistKosten/KistRegels/Facturen → Kistorders → Klanten; tabellen → Periodes (Periode jjjjmm); Slijpservice → Klanten; OmzetKlant → Klanten en Periodes; transporttabellen → Kistorders/Klanten/Periodes.

## Belangrijke metingen (KistKosten, tenzij anders)
```dax
Kosten = CALCULATE ( SUM ( KistKosten[Bedrag] ),
    KEEPFILTERS ( NOT KistKosten[Categorie] IN { "Omzet", "Revisie (omzet, niet in slijpmarge)", "Revisie (kosten, niet in slijpmarge)" } ),
    KEEPFILTERS ( KistKosten[Categorie] <> "Overige kosten" || KistKosten[Bedrag] >= 0 ) )
Omzet = CALCULATE ( SUM ( KistKosten[Bedrag] ), KEEPFILTERS ( KistKosten[Categorie] = "Omzet" ) )
'Kosten contract' = [Kosten] - [Meerkosten extra messen] + [Kosten zonder kistregel (toegerekend)]
'Geplande omzet slijpservice' = CALCULATE ( SUM ( Omzetplanning[Bedrag] ) - SUM ( Omzetplanning[BedragRevisie] ), KEEPFILTERS ( Omzetplanning[Maand] <= TODAY () ) )
'Kosten contractorder' = CALCULATE ( - SUM ( Slijpservice[BedragSAP] ), Slijpservice[Waardesoort] = "ISW",
    Slijpservice[Kostengroep] <> "Revisie (niet in slijpmarge)", TREATAS ( VALUES ( Periodes[Periode] ), Slijpservice[Periode] ),
    TREATAS ( CALCULATETABLE ( VALUES ( Omzetplanning[Referentie] ), ALL ( Omzetplanning ), Omzetplanning[Bron] = "Contract" ), Slijpservice[ContractId] ) )
```
Verder o.a.: Slijpen B.M., Afkeur SAP, Nieuwe kisten, Verzendkosten M46U, Commissie IKP, Meerkosten extra messen, Kosten per jaar, Afschrijving nieuwe kisten per jaar, Verwachte omzet, Saldo (verwacht), Nog te factureren, Achterstallig, Revisie omzet/kosten, Contractkosten zonder contractwaarde, Contractmateriaal per jaar, Zendingen (GOB+GVR), Kistregels zonder GOB/GVR, Omzet op kist-/contract-/andere orders (OmzetKlant), Gefactureerd/Credits (Facturen), Nieuwe contracten (aanvullen) en Contractbron kleur (Servicecontracten).

Patronen:
- Toerekening: `IF ( ISFILTERED ( Robots ) || ISFILTERED ( Kisttypen ) || ISFILTERED ( KistRegels ), SUMX ( VALUES ( Klanten[KUNDEN_NR] ), [X] * DIVIDE ( [Calculatiewaarde slijpen], CALCULATE ( [Calculatiewaarde slijpen], REMOVEFILTERS ( Robots ), REMOVEFILTERS ( Kisttypen ), REMOVEFILTERS ( KistRegels ) ) ) ), [X] )`
- Cut-off: `KEEPFILTERS ( Periodes[Maand] < DATE ( YEAR ( TODAY () ), MONTH ( TODAY () ), 1 ) )`
- Tabellen zonder relatie met Periodes: `TREATAS ( VALUES ( Periodes[Periode] ), Tabel[Periode] )`.
- Berekende kolommen/tabellen die andere tabellen lezen: `FILTER ( ALLNOBLANKROW ( … ) )`/`GROUPBY … CURRENTGROUP ()`, geen `CALCULATE` (voorkomt circulaire afhankelijkheden).

## Rapport (pagina's)
Samenvatting, Betalingen, Afspraken, Per klant, Kisten per klant, Calculatie en marge, Nieuw contract, Meerkosten, Per kist (incl. serienummercontrole, zendingen), Afkeur, Slijpservice (contracten, Waarde slijpservice, overige contractkosten, revisie, Bron-kleur), Facturen, Omzet per order, PO's, en transport: Kisten per zending, Controle kistkoppeling, Transport en afleverbonnen, Transport broncontrole. Slicers o.a. Maandstatus (lopende maand selecteerbaar), robot, klant, gewenste marge.
