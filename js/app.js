/* ── Globals ─────────────────────────────────────────────── */

let currentLocale = "pl";
let currentCurrency = "PLN";
let currentLabelSetId = "eu-2020-740-c1";
let debounceTimer = null;

/* ── Helpers ─────────────────────────────────────────────── */

function t(key) {
  return (LOCALES[currentLocale] || LOCALES.pl)[key] || key;
}

function getLabelSet() {
  return LABEL_SETS.find((s) => s.id === currentLabelSetId) || LABEL_SETS[0];
}

function getSelectedClasses() {
  const checks = document.querySelectorAll(".class-check:checked");
  return Array.from(checks).map((cb) => cb.value);
}

function getNumericVal(id, fallback) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  const v = parseFloat(el.value);
  return isNaN(v) ? fallback : v;
}

function pluralYears(n, locale) {
  if (locale !== "pl") return n === 1 ? t("year") : t("years");
  if (n === 1) return t("year");
  const frac = n % 10;
  const tens = n % 100;
  if (frac >= 2 && frac <= 4 && (tens < 12 || tens > 14))
    return t("yearPlural");
  return t("yearPluralMany");
}

function pluralMonths(n, locale) {
  if (locale !== "pl") return n === 1 ? t("month") : t("months");
  if (n === 1) return t("month");
  const frac = n % 10;
  const tens = n % 100;
  if (frac >= 2 && frac <= 4 && (tens < 12 || tens > 14))
    return t("monthPlural");
  return t("monthPluralMany");
}

function formatDuration(totalMonths, locale) {
  const m = Math.round(totalMonths);
  const yrs = Math.floor(m / 12);
  const mo = m % 12;
  const parts = [];
  if (yrs > 0) parts.push(yrs + " " + pluralYears(yrs, locale));
  if (mo > 0) parts.push(mo + " " + pluralMonths(mo, locale));
  return parts.join(" ") || "0 " + t("monthPluralMany");
}

/* ── Build UI ────────────────────────────────────────────── */

function buildUI() {
  const ls = getLabelSet();
  const loc = LOCALES[currentLocale] || LOCALES.pl;

  // Title
  document.getElementById("appTitle").textContent = t("title");
  document.getElementById("appSubtitle").textContent = t("subtitle");

  // Label set selector
  const lsSelect = document.getElementById("labelSetSelect");
  lsSelect.innerHTML = "";
  var labelSetNames = loc.labelSetNames || {};
  LABEL_SETS.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = labelSetNames[s.id] || (s.name + " (" + s.type + ")");
    if (s.id === currentLabelSetId) opt.selected = true;
    lsSelect.appendChild(opt);
  });

  // Currency selector
  const curSelect = document.getElementById("currencySelect");
  curSelect.innerHTML = "";
  Object.keys(CURRENCIES).forEach((code) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = code + " (" + CURRENCIES[code].symbol + ")";
    if (code === currentCurrency) opt.selected = true;
    curSelect.appendChild(opt);
  });

  // Language selector
  const locSelect = document.getElementById("localeSelect");
  locSelect.innerHTML = "";
  Object.keys(LOCALES).forEach((code) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = LOCALES[code].languageName || code;
    if (code === currentLocale) opt.selected = true;
    locSelect.appendChild(opt);
  });

  // Update html lang and page title
  document.documentElement.lang = currentLocale;
  document.title = t("title");

  // Labels in UI
  document.getElementById("labelLabelSet").textContent = t("labelSet");
  document.getElementById("labelCurrency").textContent = t("currency");
  document.getElementById("labelLanguage").textContent = t("language");
  document.getElementById("labelParameters").textContent = t("parameters");
  document.getElementById("labelAnnualKm").textContent = t("annualKm");
  document.getElementById("labelFuelPrice").textContent = t("fuelPrice");
  document.getElementById("labelFuelConsumption").textContent =
    t("fuelConsumption");
  document.getElementById("labelProjectionYears").textContent =
    t("projectionYears");
  document.getElementById("labelSelectClasses").textContent =
    t("selectClasses");
  document.getElementById("labelTirePrices").textContent = t("tirePrices");
  document.getElementById("resultsTitle").textContent = t("resultsTitle");
  document.getElementById("chartTitle").textContent = t("chartTitle");
  document.getElementById("copyBtn").textContent = t("copy");
  document.getElementById("chartGuideHeader").textContent = t("chartGuideHeader");
  document.getElementById("chartGuideLine").textContent = t("chartGuideLine");
  document.getElementById("chartGuideBand").textContent = t("chartGuideBand");
  document.getElementById("chartGuideDotted").textContent = t("chartGuideDotted");
  document.getElementById("chartGuideDot").textContent = t("chartGuideDot");
  document.getElementById("chartGuideLegend").textContent = t("chartGuideLegend");
  document.getElementById("infoHeader").textContent = t("infoHeader");
  document.getElementById("infoText").textContent = t("infoText");
  var resetBtn = document.getElementById("resetBtn");
  resetBtn.textContent = t("reset");
  resetBtn.title = t("reset");

  // Currency symbol in fuel price
  document.getElementById("fuelPriceUnit").textContent =
    CURRENCIES[currentCurrency].symbol + "/l";

  // Fuel price variation dropdown title
  document.getElementById("fuelPriceVariation").title = t("fuelPriceVariation");

  buildClassCheckboxes();
  buildTirePriceInputs();
}

function buildClassCheckboxes() {
  const ls = getLabelSet();
  const container = document.getElementById("classCheckboxes");
  const previouslySelected = getSelectedClasses();
  container.innerHTML = "";

  ls.classes.forEach((cls) => {
    const id = "class-" + cls.label;

    const row = document.createElement("div");
    row.className =
      "flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors";

    const lbl = document.createElement("label");
    lbl.className = "flex items-center gap-2 cursor-pointer flex-1 min-w-0";
    lbl.htmlFor = id;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "class-check w-4 h-4 accent-blue-600";
    cb.value = cls.label;
    cb.id = id;
    if (previouslySelected.includes(cls.label)) {
      cb.checked = true;
    }
    cb.addEventListener("change", onClassChange);

    const badge = document.createElement("span");
    badge.className =
      "inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold shrink-0";
    badge.style.backgroundColor = CLASS_COLORS[cls.label] || "#6b7280";
    badge.textContent = cls.label;

    const info = document.createElement("span");
    info.className = "text-sm text-gray-600";
    info.textContent = cls.min + "–" + cls.max + " N/kN";

    lbl.appendChild(cb);
    lbl.appendChild(badge);
    lbl.appendChild(info);

    // Hidden native color picker
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = CLASS_COLORS[cls.label] || "#6b7280";
    colorInput.style.cssText = "position:absolute;width:0;height:0;opacity:0;pointer-events:none";
    colorInput.addEventListener("input", function (e) {
      CLASS_COLORS[cls.label] = e.target.value;
      badge.style.backgroundColor = e.target.value;
      buildTirePriceInputs();
      recalculate();
    });

    // Gear button triggers color picker
    const gearBtn = document.createElement("button");
    gearBtn.type = "button";
    gearBtn.className = "shrink-0 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer";
    gearBtn.style.fontSize = "14px";
    gearBtn.textContent = "\u2699";
    gearBtn.addEventListener("click", function () {
      colorInput.click();
    });

    row.appendChild(lbl);
    row.appendChild(colorInput);
    row.appendChild(gearBtn);
    container.appendChild(row);
  });
}

function buildTirePriceInputs() {
  const selected = getSelectedClasses();
  const container = document.getElementById("tirePriceInputs");
  const existing = {};
  container.querySelectorAll("input").forEach((inp) => {
    existing[inp.dataset.classLabel] = inp.value;
  });

  container.innerHTML = "";

  if (selected.length < 2) {
    container.innerHTML =
      '<p class="text-sm text-gray-400 italic">' + t("selectAtLeast") + "</p>";
    return;
  }

  selected.forEach((label) => {
    const wrapper = document.createElement("div");
    wrapper.className = "flex items-center gap-2";

    const badge = document.createElement("span");
    badge.className =
      "inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold shrink-0";
    badge.style.backgroundColor = CLASS_COLORS[label] || "#6b7280";
    badge.textContent = label;

    const inp = document.createElement("input");
    inp.type = "number";
    inp.min = "0";
    inp.step = "10";
    inp.placeholder = t("tirePriceFor") + " " + label;
    inp.className =
      "tire-price-input w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
    inp.dataset.classLabel = label;
    if (existing[label]) inp.value = existing[label];
    inp.addEventListener("input", onInputChange);

    const unit = document.createElement("span");
    unit.className = "text-sm text-gray-500 shrink-0";
    unit.textContent = CURRENCIES[currentCurrency].symbol;

    wrapper.appendChild(badge);
    wrapper.appendChild(inp);
    wrapper.appendChild(unit);
    container.appendChild(wrapper);
  });
}

/* ── Recalculation ───────────────────────────────────────── */

function recalculate() {
  const selected = getSelectedClasses();
  const ls = getLabelSet();
  const kmPerYear = getNumericVal("annualKm", 15000);
  const fuelPrice = getNumericVal("fuelPrice", 6.5);
  const consumption = getNumericVal("fuelConsumption", 7.0);
  const maxYears = getNumericVal("projectionYears", 5);

  const resultsContainer = document.getElementById("resultsCards");
  const chartContainer = document.getElementById("chartWrapper");
  const chartGuide = document.getElementById("chartGuide");

  if (selected.length < 2) {
    resultsContainer.innerHTML =
      '<p class="text-gray-400 italic col-span-full">' +
      t("selectAtLeast") +
      "</p>";
    chartContainer.classList.add("hidden");
    chartGuide.classList.add("hidden");
    return;
  }

  chartContainer.classList.remove("hidden");
  chartGuide.classList.remove("hidden");

  // Find the best class (lowest RRC) among selected to use as baseline
  const selectedClasses = selected
    .map((label) => ls.classes.find((c) => c.label === label))
    .filter(Boolean)
    .sort((a, b) => a.midpoint - b.midpoint);

  const baseline = selectedClasses[0];
  const others = selectedClasses.slice(1);

  // Get tire prices
  const tirePrices = {};
  document.querySelectorAll(".tire-price-input").forEach((inp) => {
    const v = parseFloat(inp.value);
    if (!isNaN(v) && v > 0) tirePrices[inp.dataset.classLabel] = v;
  });

  const fuelPriceVar = getNumericVal("fuelPriceVariation", 0);
  const baseFuelCost = fuelCostPerYear(kmPerYear, fuelPrice, consumption);

  // Build result cards
  resultsContainer.innerHTML = "";

  // Baseline card
  const baseCard = document.createElement("div");
  baseCard.className = "bg-gray-50 rounded-xl p-4 border border-gray-200";
  baseCard.innerHTML =
    '<div class="flex items-center gap-2 mb-2">' +
    '<span class="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold" style="background-color:' +
    (CLASS_COLORS[baseline.label] || "#6b7280") +
    '">' +
    baseline.label +
    "</span>" +
    '<span class="font-semibold text-gray-700">' +
    t("baseline") +
    "</span></div>" +
    '<p class="text-sm text-gray-500">' +
    t("fuelCostYear") +
    ": " +
    formatCurrency(baseFuelCost, currentCurrency) +
    "</p>";
  resultsContainer.appendChild(baseCard);

  // Chart datasets
  const chartDatasets = [];

  others.forEach((cls) => {
    const saving = annualSavings(
      cls.midpoint,
      baseline.midpoint,
      kmPerYear,
      fuelPrice,
      consumption
    );

    // Min/max savings based on RRC ranges
    const savingMax = annualSavings(
      cls.max, baseline.min, kmPerYear, fuelPrice, consumption
    );
    const savingMin = annualSavings(
      cls.min, baseline.max, kmPerYear, fuelPrice, consumption
    );

    const tirePriceDiff =
      (tirePrices[baseline.label] || 0) - (tirePrices[cls.label] || 0);
    const tpd = tirePriceDiff > 0 ? tirePriceDiff : 0;
    const cumData = cumulativeSavingsOverMonths(saving, maxYears, tpd);
    const cumDataMax = cumulativeSavingsOverMonths(savingMax, maxYears, tpd);
    const cumDataMin = cumulativeSavingsOverMonths(savingMin, maxYears, tpd);
    const beMonths = tirePriceDiff > 0 ? breakEvenMonths(saving, tirePriceDiff) : null;

    // Result card
    const card = document.createElement("div");
    card.className = "bg-white rounded-xl p-4 border border-gray-200 shadow-sm";

    let beText = "";
    if (beMonths !== null) {
      if (beMonths === Infinity || beMonths > maxYears * 12) {
        beText =
          '<p class="text-sm text-red-500 mt-1">' + t("neverRecovers") + "</p>";
      } else {
        beText =
          '<p class="text-sm text-green-600 mt-1">' +
          t("breakevenAfter") +
          " " +
          formatDuration(beMonths, currentLocale) +
          "</p>";
      }
    }

    card.innerHTML =
      '<div class="flex items-center gap-2 mb-2">' +
      '<span class="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold" style="background-color:' +
      (CLASS_COLORS[cls.label] || "#6b7280") +
      '">' +
      cls.label +
      "</span>" +
      '<span class="font-semibold text-gray-700">' +
      t("savingsVs") +
      " " +
      cls.label +
      "</span></div>" +
      '<p class="text-sm text-gray-600">' +
      t("annualSaving") +
      ": " +
      formatCurrency(saving, currentCurrency) +
      "</p>" +
      '<p class="text-sm text-gray-600">' +
      t("totalOver") +
      " " +
      maxYears +
      " " +
      pluralYears(maxYears, currentLocale) +
      ": " +
      formatCurrency(saving * maxYears, currentCurrency) +
      "</p>" +
      beText;

    resultsContainer.appendChild(card);

    // Chart datasets: max bound, min bound (filled to max), then midpoint line
    const maxIdx = chartDatasets.length;
    chartDatasets.push({
      classLabel: cls.label,
      label: cls.label + " max",
      data: cumDataMax.map((d) => d.cumulative),
      isBand: true,
      fillTarget: null,
    });
    chartDatasets.push({
      classLabel: cls.label,
      label: cls.label + " min",
      data: cumDataMin.map((d) => d.cumulative),
      isBand: true,
      fillTarget: maxIdx,
    });

    const validBe = beMonths !== null && beMonths !== Infinity && beMonths <= maxYears * 12;
    chartDatasets.push({
      classLabel: cls.label,
      label:
        t("classLabel") +
        " " +
        baseline.label +
        " vs " +
        cls.label,
      data: cumData.map((d) => d.cumulative),
      isBreakeven: false,
      breakevenMonth: validBe ? beMonths : null,
    });

    // Fuel price variation lines
    if (fuelPriceVar > 0) {
      const pctFrac = fuelPriceVar / 100;
      const fuelPriceHigh = fuelPrice * (1 + pctFrac);
      const fuelPriceLow = fuelPrice * (1 - pctFrac);

      const savingHigh = annualSavings(
        cls.midpoint, baseline.midpoint, kmPerYear, fuelPriceHigh, consumption
      );
      const savingLow = annualSavings(
        cls.midpoint, baseline.midpoint, kmPerYear, fuelPriceLow, consumption
      );

      const cumDataHigh = cumulativeSavingsOverMonths(savingHigh, maxYears, tpd);
      const cumDataLow = cumulativeSavingsOverMonths(savingLow, maxYears, tpd);

      const beHigh = tirePriceDiff > 0 ? breakEvenMonths(savingHigh, tirePriceDiff) : null;
      const beLow = tirePriceDiff > 0 ? breakEvenMonths(savingLow, tirePriceDiff) : null;
      const validBeHigh = beHigh !== null && beHigh !== Infinity && beHigh <= maxYears * 12;
      const validBeLow = beLow !== null && beLow !== Infinity && beLow <= maxYears * 12;

      chartDatasets.push({
        classLabel: cls.label,
        label: t("classLabel") + " " + baseline.label + " vs " + cls.label + " (+" + fuelPriceVar + "%)",
        data: cumDataHigh.map((d) => d.cumulative),
        isFuelVariation: true,
        breakevenMonth: validBeHigh ? beHigh : null,
      });
      chartDatasets.push({
        classLabel: cls.label,
        label: t("classLabel") + " " + baseline.label + " vs " + cls.label + " (\u2212" + fuelPriceVar + "%)",
        data: cumDataLow.map((d) => d.cumulative),
        isFuelVariation: true,
        breakevenMonth: validBeLow ? beLow : null,
      });
    }
  });

  renderChart(chartDatasets, maxYears, currentLocale, currentCurrency);
  saveState();
}

/* ── State management ────────────────────────────────────── */

function collectState() {
  const tirePrices = {};
  document.querySelectorAll(".tire-price-input").forEach((inp) => {
    const v = parseFloat(inp.value);
    if (!isNaN(v) && v > 0) tirePrices[inp.dataset.classLabel] = v;
  });

  const customColors = {};
  Object.keys(CLASS_COLORS).forEach(function (k) {
    if (CLASS_COLORS[k] !== DEFAULT_CLASS_COLORS[k]) {
      customColors[k] = CLASS_COLORS[k];
    }
  });

  var state = {
    l: currentLocale,
    c: currentCurrency,
    s: currentLabelSetId,
    cl: getSelectedClasses(),
    km: getNumericVal("annualKm", 15000),
    fp: getNumericVal("fuelPrice", 6.5),
    fc: getNumericVal("fuelConsumption", 7.0),
    y: getNumericVal("projectionYears", 5),
    fv: getNumericVal("fuelPriceVariation", 0),
    tp: tirePrices,
  };
  if (Object.keys(customColors).length) state.cc = customColors;
  return state;
}

function applyState(state) {
  if (!state) return false;

  currentLocale = state.l || "pl";
  currentCurrency = state.c || "PLN";
  currentLabelSetId = state.s || LABEL_SETS[0].id;

  // Restore custom colors
  Object.assign(CLASS_COLORS, DEFAULT_CLASS_COLORS);
  if (state.cc) {
    Object.assign(CLASS_COLORS, state.cc);
  }

  buildUI();

  if (state.km) document.getElementById("annualKm").value = state.km;
  if (state.fp) document.getElementById("fuelPrice").value = state.fp;
  if (state.fc) document.getElementById("fuelConsumption").value = state.fc;
  if (state.y) document.getElementById("projectionYears").value = state.y;
  if (state.fv) document.getElementById("fuelPriceVariation").value = state.fv;

  // Check classes
  if (state.cl && state.cl.length) {
    document.querySelectorAll(".class-check").forEach((cb) => {
      cb.checked = state.cl.includes(cb.value);
    });
  }

  buildTirePriceInputs();

  // Fill tire prices
  if (state.tp) {
    document.querySelectorAll(".tire-price-input").forEach((inp) => {
      const label = inp.dataset.classLabel;
      if (state.tp[label]) inp.value = state.tp[label];
    });
  }

  recalculate();
  return true;
}

function saveState() {
  stateToUrl(collectState());
}

/* ── Event handlers ──────────────────────────────────────── */

function onInputChange() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    recalculate();
  }, 150);
}

function onClassChange() {
  buildTirePriceInputs();
  recalculate();
}

function onLabelSetChange() {
  currentLabelSetId = document.getElementById("labelSetSelect").value;
  buildClassCheckboxes();
  buildTirePriceInputs();
  recalculate();
}

function onCurrencyChange() {
  currentCurrency = document.getElementById("currencySelect").value;
  buildUI();
  recalculate();
}

function onLocaleChange() {
  currentLocale = document.getElementById("localeSelect").value;
  buildUI();
  recalculate();
}

function onReset() {
  // Clear URL hash
  history.replaceState(null, "", window.location.pathname);

  // Reset globals to defaults
  currentLocale = "pl";
  currentCurrency = "PLN";
  currentLabelSetId = LABEL_SETS[0].id;
  Object.assign(CLASS_COLORS, DEFAULT_CLASS_COLORS);

  buildUI();

  // Reset inputs to defaults
  document.getElementById("annualKm").value = 15000;
  document.getElementById("fuelPrice").value = 6.5;
  document.getElementById("fuelConsumption").value = 7.0;
  document.getElementById("projectionYears").value = 5;
  document.getElementById("fuelPriceVariation").value = 0;

  // Uncheck all classes
  document.querySelectorAll(".class-check").forEach((cb) => {
    cb.checked = false;
  });

  buildTirePriceInputs();
  destroyChart();
  recalculate();
}

function onCopyLink() {
  const url = getShareableUrl();
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("copyBtn");
    const orig = btn.textContent;
    btn.textContent = t("copied");
    setTimeout(() => {
      btn.textContent = orig;
    }, 1500);
  });
}

/* ── Init ────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  // Try loading state from URL
  const saved = stateFromUrl();
  if (saved) {
    applyState(saved);
  } else {
    buildUI();
    // Select C and E by default for a meaningful comparison
    const checks = document.querySelectorAll(".class-check");
    checks.forEach((cb) => {
      if (cb.value === "C" || cb.value === "E") cb.checked = true;
    });
    buildTirePriceInputs();
    recalculate();
  }

  // Wire up events
  document
    .getElementById("labelSetSelect")
    .addEventListener("change", onLabelSetChange);
  document
    .getElementById("currencySelect")
    .addEventListener("change", onCurrencyChange);
  document
    .getElementById("localeSelect")
    .addEventListener("change", onLocaleChange);
  document
    .getElementById("annualKm")
    .addEventListener("input", onInputChange);
  document
    .getElementById("fuelPrice")
    .addEventListener("input", onInputChange);
  document
    .getElementById("fuelConsumption")
    .addEventListener("input", onInputChange);
  document
    .getElementById("projectionYears")
    .addEventListener("input", onInputChange);
  document
    .getElementById("fuelPriceVariation")
    .addEventListener("change", onInputChange);
  document
    .getElementById("copyBtn")
    .addEventListener("click", onCopyLink);
  document
    .getElementById("resetBtn")
    .addEventListener("click", onReset);
});
