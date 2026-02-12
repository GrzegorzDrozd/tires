/* ── Detail Chart with Free Crosshair & Side Panel ─────── */

let detailChart = null;
let crosshairX = null;
let crosshairY = null;
let crosshairMonth = null;
let crosshairValue = null;
let highlightedClassLabel = null;
let panelBlocks = {};
let detailLocale = null;
let detailCurrencyCode = null;
let detailClassInfos = [];
let detailBreakevenPoints = [];
let detailFuelPriceVar = 0;
let detailBaselineRRC = 0;
let detailBaseFuelCost = 0;

/**
 * Linear interpolation between integer-indexed data points.
 */
function interpolateValue(dataArray, monthFloat) {
  if (!dataArray || !dataArray.length) return 0;
  if (monthFloat <= 0) return dataArray[0] || 0;
  if (monthFloat >= dataArray.length - 1) return dataArray[dataArray.length - 1] || 0;
  var lo = Math.floor(monthFloat);
  var hi = lo + 1;
  var frac = monthFloat - lo;
  return dataArray[lo] + (dataArray[hi] - dataArray[lo]) * frac;
}

/**
 * Crosshair plugin — free 2D pointer, not snapped to lines.
 */
var crosshairPlugin = {
  id: "crosshairDetail",
  afterEvent: function (chart, args) {
    var evt = args.event;
    // On mouseout, keep last valid in-band position
    if (evt.type === "mouseout" || !evt.x) return;

    if (evt.type === "mousemove") {
      var area = chart.chartArea;
      var xScale = chart.scales.x;
      var yScale = chart.scales.y;

      // Clamp to chart area
      var px = Math.max(area.left, Math.min(evt.x, area.right));
      var py = Math.max(area.top, Math.min(evt.y, area.bottom));

      var monthVal = xScale.getValueForPixel(px);
      if (monthVal < 0) monthVal = 0;
      if (monthVal > xScale.max) monthVal = xScale.max;

      var yVal = yScale.getValueForPixel(py);

      // Only update if cursor is inside any class band
      var inAnyBand = false;
      for (var ci = 0; ci < detailClassInfos.length; ci++) {
        var info = detailClassInfos[ci];
        var minVal = interpolateValue(info.dataMin, monthVal);
        var maxVal = interpolateValue(info.dataMax, monthVal);
        if (yVal >= minVal && yVal <= maxVal) {
          inAnyBand = true;
          break;
        }
      }
      if (!inAnyBand) return;

      crosshairX = px;
      crosshairY = py;
      crosshairMonth = monthVal;
      crosshairValue = yVal;
      updateDetailPanel();
      args.changed = true;
    }
  },
  afterDatasetsDraw: function (chart) {
    if (crosshairX == null || crosshairY == null) return;
    var area = chart.chartArea;
    if (crosshairX < area.left || crosshairX > area.right) return;
    if (crosshairY < area.top || crosshairY > area.bottom) return;

    var ctx = chart.ctx;
    var loc = detailLocale || LOCALES.pl;

    // Vertical dashed line
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.moveTo(crosshairX, area.top);
    ctx.lineTo(crosshairX, area.bottom);
    ctx.stroke();
    ctx.restore();

    // Horizontal dashed line
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.moveTo(area.left, crosshairY);
    ctx.lineTo(area.right, crosshairY);
    ctx.stroke();
    ctx.restore();

    // Find which class band(s) contain the cursor
    var activeClass = null;
    for (var ci = 0; ci < detailClassInfos.length; ci++) {
      var info = detailClassInfos[ci];
      var minVal = interpolateValue(info.dataMin, crosshairMonth);
      var maxVal = interpolateValue(info.dataMax, crosshairMonth);
      if (crosshairValue >= minVal && crosshairValue <= maxVal) {
        activeClass = info;
        break;
      }
    }

    // Cursor dot (always in a band since we only track in-band positions)
    var dotColor = activeClass
      ? (CLASS_COLORS[activeClass.classLabel] || "#6b7280")
      : "#6b7280";
    ctx.save();
    ctx.beginPath();
    ctx.arc(crosshairX, crosshairY, 5, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Value pill at cursor
    var valueText = formatCurrency(crosshairValue, detailCurrencyCode);
    var labelOnRight = crosshairX < area.right - 110;
    var labelAbove = crosshairY > area.top + 30;
    var pillOffsetX = labelOnRight ? 10 : -10;
    var pillOffsetY = labelAbove ? -20 : 20;
    var pillX = crosshairX + pillOffsetX;
    var pillY = crosshairY + pillOffsetY;

    ctx.save();
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = labelOnRight ? "left" : "right";
    ctx.textBaseline = "middle";
    var textW = ctx.measureText(valueText).width;
    var bgX = labelOnRight ? pillX - 4 : pillX - textW - 4;

    ctx.fillStyle = dotColor;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bgX, pillY - 8, textW + 8, 16, 4);
    } else {
      ctx.rect(bgX, pillY - 8, textW + 8, 16);
    }
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.fillText(valueText, pillX, pillY);
    ctx.restore();

    // Month label at top
    var m = Math.round(crosshairMonth);
    var yrs = Math.floor(m / 12);
    var mo = m % 12;
    var timeLabel;
    if (yrs > 0 && mo > 0) timeLabel = yrs + " " + loc.yearShort + " " + mo + " " + loc.monthShort;
    else if (yrs > 0) timeLabel = yrs + " " + loc.yearShort;
    else timeLabel = mo + " " + loc.monthShort;

    ctx.save();
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.textAlign = "center";
    ctx.fillText(timeLabel, crosshairX, area.top - 4);
    ctx.restore();
  },
};

/**
 * Build the side panel DOM blocks, one per comparison class.
 */
function buildDetailPanel(classInfos) {
  var panel = document.getElementById("detailPanel");
  panel.innerHTML = "";
  panelBlocks = {};
  var loc = detailLocale || LOCALES.pl;

  classInfos.forEach(function (info) {
    var block = document.createElement("div");
    block.className = "rounded-xl p-3 border border-gray-200 cursor-pointer transition-all hover:shadow-sm";
    block.dataset.classLabel = info.classLabel;

    var color = CLASS_COLORS[info.classLabel] || "#6b7280";

    // Header: badge + class label
    var header = document.createElement("div");
    header.className = "flex items-center gap-2 mb-2";

    var badge = document.createElement("span");
    badge.className = "inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold shrink-0";
    badge.style.backgroundColor = color;
    badge.textContent = info.classLabel;

    var title = document.createElement("span");
    title.className = "font-semibold text-gray-700 text-sm";
    title.textContent = info.chartLabel;

    header.appendChild(badge);
    header.appendChild(title);
    block.appendChild(header);

    // Cumulative savings value (dynamic)
    var cumLine = document.createElement("div");
    cumLine.className = "text-sm text-gray-600";
    var cumLabel = document.createElement("span");
    cumLabel.textContent = loc.detailCumSavings + ": ";
    var cumValue = document.createElement("span");
    cumValue.className = "font-semibold";
    cumLine.appendChild(cumLabel);
    cumLine.appendChild(cumValue);
    block.appendChild(cumLine);

    // Annual saving (dynamic)
    var annualLine = document.createElement("div");
    annualLine.className = "text-xs text-gray-400";
    var annualLabel = document.createElement("span");
    annualLabel.textContent = loc.detailAnnualSaving + ": ";
    var annualValue = document.createElement("span");
    annualLine.appendChild(annualLabel);
    annualLine.appendChild(annualValue);
    block.appendChild(annualLine);

    // Fuel price variation lines (before break-even)
    var varHighEl = null;
    var varLowEl = null;
    if (detailFuelPriceVar > 0) {
      var varHighLine = document.createElement("div");
      varHighLine.className = "text-xs text-gray-400 flex justify-between";
      var varHighLabel = document.createElement("span");
      varHighLabel.textContent = "+" + detailFuelPriceVar + "%";
      varHighEl = document.createElement("span");
      varHighLine.appendChild(varHighLabel);
      varHighLine.appendChild(varHighEl);
      block.appendChild(varHighLine);

      var varLowLine = document.createElement("div");
      varLowLine.className = "text-xs text-gray-400 flex justify-between";
      var varLowLabel = document.createElement("span");
      varLowLabel.textContent = "\u2212" + detailFuelPriceVar + "%";
      varLowEl = document.createElement("span");
      varLowLine.appendChild(varLowLabel);
      varLowLine.appendChild(varLowEl);
      block.appendChild(varLowLine);
    }

    // Implied RRC (dynamic)
    var rrcLine = document.createElement("div");
    rrcLine.className = "text-xs text-gray-400 flex justify-between";
    var rrcLabel = document.createElement("span");
    rrcLabel.textContent = "RRC";
    var rrcValue = document.createElement("span");
    rrcLine.appendChild(rrcLabel);
    rrcLine.appendChild(rrcValue);
    block.appendChild(rrcLine);

    // Break-even info (dynamic)
    var beLine = document.createElement("div");
    beLine.className = "text-xs mt-1";
    block.appendChild(beLine);

    // Click handler
    block.addEventListener("click", function () {
      onPanelBlockClick(info.classLabel);
    });

    panel.appendChild(block);

    panelBlocks[info.classLabel] = {
      block: block,
      cumValue: cumValue,
      annualValue: annualValue,
      rrcValue: rrcValue,
      beLine: beLine,
      varHighEl: varHighEl,
      varLowEl: varLowEl,
      data: info.data,
      dataMin: info.dataMin,
      dataMax: info.dataMax,
      dataHigh: info.dataHigh,
      dataLow: info.dataLow,
      tirePriceDiff: info.tirePriceDiff,
      annualSaving: info.annualSaving,
      breakevenMonths: info.breakevenMonths,
      maxMonths: info.maxMonths,
      clsMidpoint: info.clsMidpoint,
      clsMin: info.clsMin,
      clsMax: info.clsMax,
      color: color,
    };
  });

  // Set initial values
  updateDetailPanel();
}

function formatDetailDuration(totalMonths, loc) {
  var m = Math.round(totalMonths);
  var yrs = Math.floor(m / 12);
  var mo = m % 12;
  var parts = [];
  if (yrs > 0) parts.push(yrs + " " + loc.yearShort);
  if (mo > 0) parts.push(mo + " " + loc.monthShort);
  return parts.join(" ") || "0 " + loc.monthShort;
}

/**
 * Update panel values based on crosshair position.
 * When cursor is within a class's band, use the cursor's Y value
 * and derive annual saving + break-even from that point.
 */
function updateDetailPanel() {
  var loc = detailLocale || LOCALES.pl;
  var hovering = crosshairMonth != null && crosshairValue != null;

  Object.keys(panelBlocks).forEach(function (classLabel) {
    var pb = panelBlocks[classLabel];
    var cumVal, annVal, beMonths, inBand = false;

    if (hovering) {
      // Check if cursor Y falls within this class's band
      var minAtMonth = interpolateValue(pb.dataMin, crosshairMonth);
      var maxAtMonth = interpolateValue(pb.dataMax, crosshairMonth);
      if (crosshairValue >= minAtMonth && crosshairValue <= maxAtMonth) {
        inBand = true;
        // Use cursor Y as cumulative savings
        cumVal = crosshairValue;
        // Derive annual saving: cumSavings = (annual/12)*month - tirePriceDiff
        // So: annual = (cumSavings + tirePriceDiff) * 12 / month
        if (crosshairMonth > 0) {
          annVal = (cumVal + pb.tirePriceDiff) * 12 / crosshairMonth;
        } else {
          annVal = pb.annualSaving;
        }
        // Derive break-even from that annual rate
        if (pb.tirePriceDiff > 0 && annVal > 0) {
          beMonths = pb.tirePriceDiff / annVal * 12;
        } else {
          beMonths = null;
        }
      } else {
        // Outside band — use midpoint line value at cursor month
        cumVal = interpolateValue(pb.data, crosshairMonth);
        annVal = pb.annualSaving;
        beMonths = pb.breakevenMonths;
      }
    } else {
      // Not hovering — show end-of-projection values
      cumVal = pb.data[pb.data.length - 1] || 0;
      annVal = pb.annualSaving;
      beMonths = pb.breakevenMonths;
    }

    // Update cumulative
    pb.cumValue.textContent = formatCurrency(cumVal, detailCurrencyCode);

    // Update annual
    pb.annualValue.textContent = formatCurrency(annVal, detailCurrencyCode);

    // Update break-even
    pb.beLine.textContent = "";
    pb.beLine.className = "text-xs mt-1";
    if (beMonths !== null && beMonths !== undefined) {
      if (beMonths === Infinity || beMonths > pb.maxMonths) {
        pb.beLine.className += " text-red-500";
        pb.beLine.textContent = loc.detailNoBreakeven;
      } else {
        pb.beLine.className += " text-green-600";
        pb.beLine.textContent = loc.detailBreakevenAfter + " " + formatDetailDuration(beMonths, loc);
      }
    }

    // Fuel price variation values
    if (pb.varHighEl && pb.varLowEl && detailFuelPriceVar > 0) {
      var pctFrac = detailFuelPriceVar / 100;
      var varHighVal, varLowVal;
      if (inBand && crosshairMonth > 0) {
        // Derive from cursor-derived annual saving, scaled by fuel price change
        var highAnn = annVal * (1 + pctFrac);
        var lowAnn = annVal * (1 - pctFrac);
        varHighVal = (highAnn / 12) * crosshairMonth - pb.tirePriceDiff;
        varLowVal = (lowAnn / 12) * crosshairMonth - pb.tirePriceDiff;
      } else if (hovering) {
        varHighVal = pb.dataHigh ? interpolateValue(pb.dataHigh, crosshairMonth) : null;
        varLowVal = pb.dataLow ? interpolateValue(pb.dataLow, crosshairMonth) : null;
      } else {
        varHighVal = pb.dataHigh ? pb.dataHigh[pb.dataHigh.length - 1] : null;
        varLowVal = pb.dataLow ? pb.dataLow[pb.dataLow.length - 1] : null;
      }
      pb.varHighEl.textContent = varHighVal != null ? formatCurrency(varHighVal, detailCurrencyCode) : "";
      pb.varLowEl.textContent = varLowVal != null ? formatCurrency(varLowVal, detailCurrencyCode) : "";
    }

    // Implied RRC — interpolate position within band to RRC range
    var rrcVal;
    if (inBand) {
      var minAtMonth = interpolateValue(pb.dataMin, crosshairMonth);
      var maxAtMonth = interpolateValue(pb.dataMax, crosshairMonth);
      var bandWidth = maxAtMonth - minAtMonth;
      if (bandWidth > 0) {
        var t = (crosshairValue - minAtMonth) / bandWidth;
        rrcVal = pb.clsMin + t * (pb.clsMax - pb.clsMin);
      } else {
        rrcVal = pb.clsMidpoint;
      }
    } else {
      rrcVal = pb.clsMidpoint;
    }
    pb.rrcValue.textContent = rrcVal.toFixed(1) + " N/kN";

    // Visual: highlight block when cursor is inside its band
    if (inBand) {
      pb.block.style.borderLeftColor = pb.color;
      pb.block.style.borderLeftWidth = "3px";
    } else {
      pb.block.style.borderLeftColor = "";
      pb.block.style.borderLeftWidth = "";
    }
  });
}

/**
 * Handle panel block click — toggle highlight.
 */
function onPanelBlockClick(classLabel) {
  if (highlightedClassLabel === classLabel) {
    highlightedClassLabel = null;
  } else {
    highlightedClassLabel = classLabel;
  }
  applyHighlight();
}

/**
 * Apply highlight state to panel blocks and chart datasets.
 */
function applyHighlight() {
  // Panel blocks
  Object.keys(panelBlocks).forEach(function (cl) {
    var pb = panelBlocks[cl];
    if (highlightedClassLabel === null) {
      pb.block.className = "rounded-xl p-3 border border-gray-200 cursor-pointer transition-all hover:shadow-sm";
      pb.block.style.opacity = "";
    } else if (cl === highlightedClassLabel) {
      pb.block.className = "rounded-xl p-3 border-2 border-blue-500 shadow-sm cursor-pointer transition-all";
      pb.block.style.opacity = "";
    } else {
      pb.block.className = "rounded-xl p-3 border border-gray-200 cursor-pointer transition-all";
      pb.block.style.opacity = "0.5";
    }
  });

  // Chart datasets
  if (!detailChart) return;
  detailChart.data.datasets.forEach(function (ds) {
    if (!ds._originalBorderColor) {
      ds._originalBorderColor = ds.borderColor;
      ds._originalBackgroundColor = ds.backgroundColor;
      ds._originalBorderWidth = ds.borderWidth;
    }

    if (highlightedClassLabel === null) {
      ds.borderColor = ds._originalBorderColor;
      ds.backgroundColor = ds._originalBackgroundColor;
      ds.borderWidth = ds._originalBorderWidth;
    } else if (ds.classLabel === highlightedClassLabel) {
      ds.borderColor = ds._originalBorderColor;
      ds.backgroundColor = ds._originalBackgroundColor;
      ds.borderWidth = ds.isBand ? ds._originalBorderWidth : 4;
    } else {
      if (ds.isBand) {
        ds.backgroundColor = fadeColor(ds._originalBackgroundColor, "08");
        ds.borderColor = ds._originalBorderColor;
        ds.borderWidth = ds._originalBorderWidth;
      } else {
        ds.borderColor = fadeColor(ds._originalBorderColor, "40");
        ds.backgroundColor = fadeColor(ds._originalBackgroundColor, "10");
        ds.borderWidth = 1.5;
      }
    }
  });
  detailChart.update("none");
}

/**
 * Append or replace hex alpha suffix on a color string.
 */
function fadeColor(color, alphaSuffix) {
  if (!color || color === "transparent") return color;
  var base = color;
  if (base.length === 9 && base[0] === "#") base = base.substring(0, 7);
  if (base.length === 7 && base[0] === "#") return base + alphaSuffix;
  return color;
}

// Allow importing in Node (tests) — no-op in browsers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { interpolateValue, fadeColor, formatDetailDuration };
}

/**
 * Render the detail chart.
 */
function renderDetailChart(datasets, maxYears, locale, currencyCode, classInfos, fuelPriceVar, baselineRRC, baseFuelCost) {
  var canvas = document.getElementById("detailChart");
  var ctx = canvas.getContext("2d");
  var loc = LOCALES[locale] || LOCALES.pl;
  detailLocale = loc;
  detailCurrencyCode = currencyCode;
  detailClassInfos = classInfos;
  detailFuelPriceVar = fuelPriceVar || 0;
  detailBaselineRRC = baselineRRC || 0;
  detailBaseFuelCost = baseFuelCost || 0;
  var totalMonths = maxYears * 12;

  var labels = [];
  for (var m = 0; m <= totalMonths; m++) {
    labels.push(m);
  }

  detailBreakevenPoints = [];
  var chartDatasets = datasets.map(function (ds) {
    var color = CLASS_COLORS[ds.classLabel] || "#6b7280";

    if (ds.isBand) {
      return {
        label: ds.label,
        data: ds.data,
        classLabel: ds.classLabel,
        borderColor: "transparent",
        backgroundColor: color + "15",
        borderWidth: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: ds.fillTarget != null
          ? { target: ds.fillTarget, above: color + "15", below: color + "15" }
          : false,
        tension: 0.1,
        isBand: true,
        order: 1,
      };
    }

    if (ds.isFuelVariation) {
      if (ds.breakevenMonth != null) {
        detailBreakevenPoints.push({
          month: ds.breakevenMonth,
          color: color,
          classLabel: ds.classLabel,
        });
      }
      return {
        label: ds.label,
        data: ds.data,
        classLabel: ds.classLabel,
        borderColor: color + "99",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderDash: [4, 3],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0.1,
        isFuelVariation: true,
        order: 0,
      };
    }

    if (ds.breakevenMonth != null) {
      detailBreakevenPoints.push({
        month: ds.breakevenMonth,
        color: color,
        classLabel: ds.classLabel,
      });
    }

    return {
      label: ds.label,
      data: ds.data,
      classLabel: ds.classLabel,
      borderColor: color,
      backgroundColor: color + "22",
      borderWidth: 2.5,
      borderDash: [],
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
      tension: 0.1,
      order: 0,
    };
  });

  // Detail breakeven plugin (instance-level)
  var detailBreakevenPlugin = {
    id: "detailBreakevenMarker",
    afterDatasetsDraw: function (chart) {
      if (!detailBreakevenPoints.length) return;
      var ctx2 = chart.ctx;
      var xScale = chart.scales.x;
      var yScale = chart.scales.y;

      detailBreakevenPoints.forEach(function (bp) {
        var hidden = chart.data.datasets.some(function (ds, i) {
          return ds.classLabel === bp.classLabel && !ds.isBand && chart.getDatasetMeta(i).hidden;
        });
        if (hidden) return;

        var px = xScale.getPixelForValue(bp.month);
        var py = yScale.getPixelForValue(0);

        ctx2.save();
        ctx2.beginPath();
        ctx2.arc(px, py, 6, 0, Math.PI * 2);
        ctx2.fillStyle = bp.color;
        ctx2.fill();
        ctx2.strokeStyle = "#fff";
        ctx2.lineWidth = 2;
        ctx2.stroke();
        ctx2.restore();
      });
    },
  };

  // Compute tight Y max from actual data
  var dataMax = 0;
  chartDatasets.forEach(function (ds) {
    if (!ds.data) return;
    for (var i = 0; i < ds.data.length; i++) {
      if (ds.data[i] > dataMax) dataMax = ds.data[i];
    }
  });
  var yMax = Math.ceil(dataMax * 1.05);

  if (detailChart) {
    detailChart.data.labels = labels;
    detailChart.data.datasets = chartDatasets;
    detailChart.options.scales.x.title.text = loc.months;
    detailChart.options.scales.y.title.text =
      loc.cumulativeSavings + " (" + CURRENCIES[currencyCode].symbol + ")";
    detailChart.options.scales.y.suggestedMax = yMax;
    detailChart.update();
  } else {
    detailChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: chartDatasets,
      },
      plugins: [crosshairPlugin, detailBreakevenPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              filter: function (item, data) {
                var ds = data.datasets[item.datasetIndex];
                return !ds.isBand && !ds.isFuelVariation;
              },
            },
            onClick: function (e, legendItem, legend) {
              var chart = legend.chart;
              var clickedDs = chart.data.datasets[legendItem.datasetIndex];
              var classLabel = clickedDs.classLabel;
              chart.data.datasets.forEach(function (ds, i) {
                if (ds.classLabel === classLabel) {
                  var meta = chart.getDatasetMeta(i);
                  meta.hidden = meta.hidden === null ? true : !meta.hidden;
                }
              });
              // If hiding the focused class, deselect focus
              if (highlightedClassLabel === classLabel) {
                var nowHidden = chart.data.datasets.some(function (ds, i) {
                  return ds.classLabel === classLabel && !ds.isBand && chart.getDatasetMeta(i).hidden;
                });
                if (nowHidden) {
                  highlightedClassLabel = null;
                  applyHighlight();
                  return;
                }
              }
              chart.update();
            },
          },
          tooltip: {
            enabled: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: loc.months,
            },
            ticks: {
              callback: function (value) {
                if (value % 12 === 0) return value / 12 + " " + loc.yearShort;
                if (value % 6 === 0) return value + " " + loc.monthShort;
                return "";
              },
              maxRotation: 0,
              autoSkip: false,
            },
            grid: {
              color: function (context) {
                return context.tick.value % 12 === 0
                  ? "rgba(0,0,0,0.1)"
                  : "rgba(0,0,0,0)";
              },
            },
          },
          y: {
            title: {
              display: true,
              text:
                loc.cumulativeSavings +
                " (" +
                CURRENCIES[currencyCode].symbol +
                ")",
            },
            suggestedMax: yMax,
            ticks: {
              callback: function (value) {
                var c = CURRENCIES[currencyCode] || CURRENCIES.PLN;
                var formatted = Math.round(value).toString();
                if (c.position === "before") return c.symbol + formatted;
                return formatted + " " + c.symbol;
              },
            },
          },
        },
      },
    });
  }

  // Reset highlight state
  highlightedClassLabel = null;

  // Build/update panel
  buildDetailPanel(classInfos);
}

/**
 * Destroy detail chart and clear state.
 */
function destroyDetailChart() {
  if (detailChart) {
    detailChart.destroy();
    detailChart = null;
  }
  crosshairX = null;
  crosshairY = null;
  crosshairMonth = null;
  crosshairValue = null;
  highlightedClassLabel = null;
  panelBlocks = {};
  detailClassInfos = [];
  detailBreakevenPoints = [];
  detailFuelPriceVar = 0;
  detailBaselineRRC = 0;
  detailBaseFuelCost = 0;
  var panel = document.getElementById("detailPanel");
  if (panel) panel.innerHTML = "";
}
