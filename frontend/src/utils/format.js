const FALLBACK = "---";

export function formatDate(dateStr, options = {}) {
  if (!dateStr) return options.fallback ?? FALLBACK;

  const { locale = "en-GB", fallback = FALLBACK, dateOnly = false } = options;

  if (dateOnly) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return new Date(dateStr).toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTime(timeStr, options = {}) {
  if (!timeStr) return options.fallback ?? FALLBACK;

  const { locale = "en-IN", fallback = FALLBACK } = options;

  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined || amount === "")
    return options.fallback ?? "\u2014";

  const { locale = "en-IN", fallback = "\u2014", currency = "INR" } = options;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value, options = {}) {
  if (value === null || value === undefined) return options.fallback ?? "---";

  const { locale = "en-IN" } = options;

  return Number(value).toLocaleString(locale);
}
