# Tire Savings Calculator / Kalkulator oszczędności na oponach

Compare fuel savings between car tires with different rolling-resistance coefficients (RRC) based on EU tire label classes.

**[Live Demo](https://grzegorzdrozd.github.io/tires/)**

## Features

- Select 2+ EU tire label classes to compare (best class becomes baseline automatically)
- Enter driving parameters: annual mileage, fuel price, fuel consumption, projection period
- Line chart with cumulative monthly savings over time (Chart.js) and min/max RRC range bands
- Optional tire prices per class with break-even point on chart
- Fuel price variation (±5–25%) shown as dotted lines
- Per-class color customization via native OS color picker
- Shareable URL — all state stored in URL hash (LZString-compressed)
- Language switcher (Polish default, English)
- Multi-currency support (PLN, EUR, USD, GBP)

## How it works

The calculator uses the empirical rule that ~10% reduction in rolling resistance coefficient (RRC) leads to ~2% reduction in fuel consumption.

```
fuelReductionFraction = (worseRRC - betterRRC) / worseRRC * 0.2
annualSaving = (kmPerYear / 100) * litersPer100km * fuelPrice * fuelReductionFraction
```

RRC class definitions follow EU Regulation 2020/740 for passenger car (C1) tires.

## Usage

No build step required. Open `index.html` in a browser, or serve with any static server:

```bash
python3 -m http.server 8000
```

For GitHub Pages: served directly from the repository root.

## Author

**Grzegorz Drozd** — [github.com/GrzegorzDrozd](https://github.com/GrzegorzDrozd)

## Repository

[github.com/GrzegorzDrozd/tires](https://github.com/GrzegorzDrozd/tires)

## License

MIT
