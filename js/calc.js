/**
 * Annual fuel cost in currency units.
 */
function fuelCostPerYear(kmPerYear, fuelPriceLiter, litersPer100km) {
  return (kmPerYear / 100) * litersPer100km * fuelPriceLiter;
}

/**
 * Fractional fuel saving when switching from baseRRC to comparedRRC.
 * Positive value means comparedRRC saves fuel (lower RRC is better).
 * Empirical rule: ~10% RRC reduction ≈ ~2% fuel reduction → factor 0.2
 */
function rrcSavingsFraction(baseRRC, comparedRRC) {
  if (baseRRC <= 0) return 0;
  return ((baseRRC - comparedRRC) / baseRRC) * 0.2;
}

/**
 * Annual monetary savings when switching from baseRRC to comparedRRC.
 */
function annualSavings(baseRRC, comparedRRC, kmPerYear, fuelPrice, consumption) {
  const baseCost = fuelCostPerYear(kmPerYear, fuelPrice, consumption);
  const fraction = rrcSavingsFraction(baseRRC, comparedRRC);
  return baseCost * fraction;
}

/**
 * Build cumulative savings array for each month up to maxYears.
 * Returns array of { month, cumulative } objects.
 * tirePriceDiff is subtracted at month 0 (upfront cost).
 */
function cumulativeSavingsOverMonths(annualSaving, maxYears, tirePriceDiff) {
  const monthlySaving = annualSaving / 12;
  const totalMonths = maxYears * 12;
  const result = [];
  for (let m = 0; m <= totalMonths; m++) {
    result.push({
      month: m,
      cumulative: monthlySaving * m - (tirePriceDiff || 0),
    });
  }
  return result;
}

/**
 * Months to break even given annual saving and a one-time tire cost difference.
 * Returns Infinity if saving is zero or negative.
 */
function breakEvenMonths(annualSaving, tirePriceDifference) {
  if (annualSaving <= 0 || tirePriceDifference <= 0) return Infinity;
  return (tirePriceDifference / annualSaving) * 12;
}

// Allow importing in Node (tests) — no-op in browsers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fuelCostPerYear, rrcSavingsFraction, annualSavings, cumulativeSavingsOverMonths, breakEvenMonths };
}
