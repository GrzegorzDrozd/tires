const CURRENCIES = {
  PLN: { symbol: "zł", code: "PLN", position: "after", decimals: 2 },
  EUR: { symbol: "€", code: "EUR", position: "before", decimals: 2 },
  USD: { symbol: "$", code: "USD", position: "before", decimals: 2 },
  GBP: { symbol: "£", code: "GBP", position: "before", decimals: 2 },
};

function formatCurrency(amount, currencyCode) {
  const c = CURRENCIES[currencyCode] || CURRENCIES.PLN;
  const formatted = amount.toFixed(c.decimals);
  if (c.position === "before") {
    return c.symbol + formatted;
  }
  return formatted + " " + c.symbol;
}
