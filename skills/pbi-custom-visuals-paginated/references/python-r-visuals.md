# Python- en R-visuals

Python- en R-visuals voeren een script uit dat een **statische PNG** (72 DPI) op het canvas zet. Geen hover, geen klik, geen tooltips. Kies ze alleen als de waarde zit in een statistische berekening die tijdens het renderen moet gebeuren (modelfit, kernel density, forecastband). Een boxplot, lollipop of dumbbell is werk voor een SVG-measure of Deneb.

## Inhoud

1. Wanneer wel en niet
2. Identiteit
3. Limieten
4. Python: sjabloon en pakketten
5. R: sjabloon, pakketten en R-specifieke valkuilen
6. Het `dataset`-datamodel
7. Syntaxverschillen R vs Python
8. Valkuilen

## 1. Wanneer wel en niet

Gebruik een scriptvisual alleen als **alles** geldt:

- Er is geen native visual en geen redelijke Deneb-spec.
- De waarde zit in een berekening tijdens het renderen, niet alleen in een vorm die Vega ook kan tekenen.
- De visual hoeft geen cross-filterbron te zijn, geen hover-tooltips te hebben, niet via publish to web en niet via app-owns-data embed te werken.
- Het rapport draait op Pro/PPU of hoger, in een regio met Fabric.

Interactie nodig → Deneb. Klein inline teken (sparkline, balk, pil) → SVG-measure (geen rijlimiet, geen time-out, geen licentie-/regiodrempel, werkt bij publish to web).

**Python of R?** Python voor scikit-learn, statsmodels, scipy of als het rapport al Python gebruikt. R voor statistische standaardplots en pakketten zonder Python-tegenhanger (`forecast`, `corrplot`, `pheatmap`, ridgeline/violin). Gelijkwaardig? Kies de taal van de andere scripts in het rapport; mixen verdubbelt wat je bij publiceren moet controleren.

## 2. Identiteit

| | Python | R |
|---|---|---|
| `visualType` | `pythonVisual` | `scriptVisual` |
| Datarol | `Values` (kolommen en measures) | `Values` |
| Datavariabele | `dataset` (pandas DataFrame, automatisch) | `dataset` (data.frame, automatisch) |
| Verplichte render-aanroep | `plt.show()` als laatste regel | `print(p)` voor ggplot2 |
| Voorkeursbibliotheek | seaborn (boven kale matplotlib) | ggplot2 |
| Runtime Service | Python 3.11 | R 4.3.3 |
| Desktop | Elk lokaal geïnstalleerd pakket | Elk lokaal pakket; R apart installeren |

In PBIR staat het script in `visual.objects.script[0].properties` als `source` (stringliteral) met `provider` `'Python'` of `'R'`.

## 3. Limieten

| Beperking | Desktop | Service |
|---|---|---|
| Uitvoer | Statische PNG, 72 DPI | Statische PNG, 72 DPI |
| Time-out | 5 minuten | 1 minuut |
| Rijlimiet | 150.000 | 150.000 |
| Input | Max 250 MB | Max 250 MB |
| Uitvoergrootte | R: 2 MB | 30 MB |
| Netwerk | Onbeperkt | Geblokkeerd |
| Gateway | Alleen personal | Alleen personal |
| Cross-filter **vanuit** de visual | Nee | Nee |
| Cross-filter **ontvangen** | Ja | Ja |
| Publish to web | Nee | Nee |
| Embed (app-owns-data) | Nee | Nee |
| Losse stringwaarde | > 32.766 tekens wordt stil afgekapt | idem |

## 4. Python: sjabloon en pakketten

```python
import matplotlib.pyplot as plt
import numpy as np

# 1. Guard against empty data
if dataset.empty:
    fig, ax = plt.subplots(1, 1, figsize=(6, 4))
    ax.text(0.5, 0.5, "No data available", ha='center', va='center', fontsize=14, color='#888888')
    ax.axis('off')
    plt.show()
else:
    # 2. Data preparation (dataset is auto-injected)
    data = dataset.copy()

    # 3. Create figure with explicit size
    fig, ax = plt.subplots(figsize=(8, 4))

    # 4. Plot
    ax.plot(data["X"], data["Y"], color="#5B8DBE", linewidth=2)

    # 5. Style
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="y", alpha=0.3)

    # 6. Layout and render
    plt.tight_layout()
    plt.show()
```

Regels:

1. `plt.show()` is verplicht en de laatste regel; alleen de laatste telt, meerdere figuren worden niet ondersteund.
2. Maak `dataset` niet zelf aan; kolomnamen = weergavenamen van de velden.
3. `figsize=(w, h)` in de verhouding van de container (72 DPI).
4. Hex-kleuren die bij het rapportthema passen; verwijder overbodige assen/randen.
5. `data = dataset.copy()` vóór bewerkingen; zwaar rekenwerk in DAX/Power Query.
6. `try/except` voor robuustheid in productie.

Pakketten in de Service (Python 3.11):

| Pakket | Versie | Doel |
|---|---|---|
| matplotlib | 3.8.4 | Plotten |
| seaborn | 0.13.2 | Statistische visualisatie |
| numpy | 2.0.0 | Numeriek |
| pandas | 2.2.2 | Databewerking |
| scipy | 1.13.1 | Wetenschappelijk rekenen |
| scikit-learn | 1.5.0 | Machine learning |
| statsmodels | 0.14.2 | Statistische modellen |
| pillow | 10.4.0 | Beeldbewerking |

**Niet** in de Service: plotly, bokeh, altair. Volledige lijst: https://learn.microsoft.com/power-bi/connect-data/service-python-packages-support

## 5. R: sjabloon, pakketten en R-specifieke valkuilen

```r
library(ggplot2)

# 1. Guard against empty data
if (nrow(dataset) == 0) {
  plot.new()
  text(0.5, 0.5, "No data available", cex=1.5)
} else {
  # 2. Data preparation (index-based access)
  df <- data.frame(
    category = dataset[,1],
    value = dataset[,2]
  )

  # 3. Create visualization
  p <- ggplot(df, aes(x=reorder(category, -value), y=value)) +
    geom_col(fill="#5B8DBE", width=0.7) +
    theme_minimal(base_size=12) +
    theme(
      panel.grid.major.x = element_blank(),
      axis.title = element_blank()
    )

  # 4. Render
  print(p)
}
```

Regels:

1. `print(p)` is verplicht; ggplot2-objecten tonen zichzelf niet.
2. Kolommen bij voorkeur op index (`dataset[,1]`) om escaping te vermijden; namen met spaties met backticks: `` dataset$`Order Lines` ``.
3. `factor()` voor een vaste sorteervolgorde; `theme_minimal()`; marges met `plot.margin=margin(t, r, b, l)`.

Pakketten in de Service (R 4.3.3), selectie: ggplot2 3.5.1, dplyr 1.1.4, tidyr 1.3.1, ggrepel 0.9.5, patchwork 1.2.0, cowplot 1.1.3, corrplot 0.94, viridis 0.6.5, RColorBrewer 1.1-3, forecast 8.23.0, pheatmap 1.0.12, treemap 2.4-4, lattice 0.22-6. Ongeveer 1000 CRAN-pakketten; **niet** pakketten die netwerk nodig hebben (RgoogleMaps, mailR). Volledige lijst: https://learn.microsoft.com/power-bi/connect-data/service-r-packages-support

**R-specifieke valkuilen:**

| Valkuil | Oplossing |
|---|---|
| Kolom van type `Time` (niet `Date/Time`) | Visual geeft fout; maak er in het model `Date/Time` van |
| Tekst verdwijnt in Service (werkt wel in Desktop) | Zet `powerbi_rEnableShowText = 1` als eerste regel van het script |
| CJK-tekens leeg in Service | `powerbi_rEnableShowTextForCJKLanguages = 1` en `showtext` laden, beide vóór elke `library()` |
| Dichte plot (veel `ggrepel`-labels, fijne `geom_tile`) | Kan de 2 MB-uitvoergrens in Desktop stil overschrijden; minder marks |
| Certificering | R-visuals kunnen niet gecertificeerd worden |

```r
powerbi_rEnableShowText = 1
powerbi_rEnableShowTextForCJKLanguages = 1
if (!requireNamespace("showtext", quietly = TRUE)) install.packages("showtext")
library(showtext)
showtext_auto()
library(ggplot2)
```

## 6. Het `dataset`-datamodel

- Power BI **groepeert** `dataset` zoals een tabelvisual: identieke rijen over alle gebonden velden worden één rij. De 150.000-grens geldt voor die ontdubbelde set.
- Gevolg: per-transactiegrafieken (jitter, strip, ruwe scatter, ECDF) krijgen stil geaggregeerde data als er geen unieke sleutel gebonden is. Bootstrap e.d. geven dan fout resultaat zonder fout.
- **Per-rij-data afdwingen:** bind een gegarandeerd unieke kolom (bijv. orderregelnummer) mee in `Values`. Geen measure: dat verandert het projectietype en geeft geen rij-expansie. Geen natuurlijke sleutel? Voeg een indexkolom toe in Power Query.
- Controleer tijdens ontwikkeling het aantal rijen: `print(len(dataset))` / `nrow(dataset)`.
- `dataset` komt in willekeurige volgorde; sorteer in het script en vertrouw nooit op positie.

Voorbeeld (warehouse): een histogram van doorlooptijd per orderregel heeft `Orderregel ID` in `Values` nodig, anders tekent hij alleen unieke combinaties van de andere velden.

## 7. Syntaxverschillen R vs Python

| Aspect | R (`scriptVisual`) | Python (`pythonVisual`) |
|---|---|---|
| Render | `print(p)` | `plt.show()` |
| Kolomtoegang | `dataset[,1]` of `dataset$col` | `dataset.iloc[:,0]` of `dataset["col"]` |
| Lege-data-guard | `if (nrow(dataset) == 0)` | `if len(dataset) == 0:` |
| Categorievolgorde | `factor(x, levels=...)` | `pd.Categorical(x, categories=...)` |
| Runtime Service | R 4.3.3 | Python 3.11 |

## 8. Valkuilen

- Vergeten `plt.show()`/`print(p)` → niets te zien.
- Pakket werkt in Desktop maar niet in Service → controleer de Service-lijst.
- Script > 1 minuut → time-out in Service; reken vooraf in DAX/Power Query.
- Gebruiker verwacht klikken/tooltips → verkeerde techniek, kies Deneb.
- Rapport moet via publish to web of app-owns-data embed → scriptvisual werkt daar niet.
