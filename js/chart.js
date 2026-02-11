const DEFAULT_CLASS_COLORS = {
  A: "#16a34a",
  B: "#65a30d",
  C: "#eab308",
  D: "#f97316",
  E: "#ef4444",
};

const CLASS_COLORS = Object.assign({}, DEFAULT_CLASS_COLORS);

let savingsChart = null;
let breakevenPoints = [];
let chartLocale = null;

const breakevenPlugin = {
  id: "breakevenMarker",
  afterDatasetsDraw: function (chart) {
    if (!breakevenPoints.length) return;
    // Only draw on the main savings chart, not the detail chart
    if (chart.canvas.id !== "savingsChart") return;
    const ctx = chart.ctx;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    const loc = chartLocale || LOCALES.pl;

    breakevenPoints.forEach(function (bp) {
      // Skip if this class is hidden
      var hidden = chart.data.datasets.some(function (ds, i) {
        return ds.classLabel === bp.classLabel && !ds.isBand && chart.getDatasetMeta(i).hidden;
      });
      if (hidden) return;

      const px = xScale.getPixelForValue(bp.month);
      const py = yScale.getPixelForValue(0);

      // Dot
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = bp.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });
  },
};

Chart.register(breakevenPlugin);

function renderChart(datasets, maxYears, locale, currencyCode) {
  var canvas = document.getElementById("savingsChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const loc = LOCALES[locale] || LOCALES.pl;
  chartLocale = loc;
  const totalMonths = maxYears * 12;

  const labels = [];
  for (let m = 0; m <= totalMonths; m++) {
    labels.push(m);
  }

  breakevenPoints = [];
  const chartDatasets = datasets.map(function (ds) {
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
        breakevenPoints.push({
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
        pointHoverRadius: 3,
        fill: false,
        tension: 0.1,
        isFuelVariation: true,
        order: 0,
      };
    }

    var isDashed = ds.isBreakeven;

    if (ds.breakevenMonth != null) {
      breakevenPoints.push({
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
      borderWidth: isDashed ? 1 : 2.5,
      borderDash: isDashed ? [6, 4] : [],
      pointRadius: 0,
      pointHoverRadius: 5,
      fill: false,
      tension: 0.1,
      order: 0,
    };
  });

  if (savingsChart) {
    savingsChart.data.labels = labels;
    savingsChart.data.datasets = chartDatasets;
    savingsChart.options.scales.x.title.text = loc.months;
    savingsChart.options.scales.y.title.text =
      loc.cumulativeSavings + " (" + CURRENCIES[currencyCode].symbol + ")";
    savingsChart.update();
    return;
  }

  savingsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: chartDatasets,
    },
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
            chart.update();
          },
        },
        tooltip: {
          filter: function (item) {
            return !item.dataset.isBand;
          },
          callbacks: {
            title: function (items) {
              var m = items[0].parsed.x;
              var yrs = Math.floor(m / 12);
              var mo = m % 12;
              if (yrs > 0 && mo > 0) return yrs + " " + loc.yearShort + " " + mo + " " + loc.monthShort;
              if (yrs > 0) return yrs + " " + loc.yearShort;
              return mo + " " + loc.monthShort;
            },
            label: function (context) {
              return (
                context.dataset.label +
                ": " +
                formatCurrency(context.parsed.y, currencyCode)
              );
            },
          },
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
          ticks: {
            callback: function (value) {
              return formatCurrency(value, currencyCode);
            },
          },
        },
      },
    },
  });
}

function destroyChart() {
  if (savingsChart) {
    savingsChart.destroy();
    savingsChart = null;
  }
}
