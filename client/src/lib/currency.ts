// Currency configuration based on country/locale
export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: "USD", symbol: "$", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB" },
  JPY: { code: "JPY", symbol: "¥", locale: "ja-JP" },
  CNY: { code: "CNY", symbol: "¥", locale: "zh-CN" },
  KRW: { code: "KRW", symbol: "₩", locale: "ko-KR" },
  AUD: { code: "AUD", symbol: "A$", locale: "en-AU" },
  CAD: { code: "CAD", symbol: "C$", locale: "en-CA" },
  CHF: { code: "CHF", symbol: "CHF", locale: "de-CH" },
  THB: { code: "THB", symbol: "฿", locale: "th-TH" },
  SGD: { code: "SGD", symbol: "S$", locale: "en-SG" },
  HKD: { code: "HKD", symbol: "HK$", locale: "zh-HK" },
  TWD: { code: "TWD", symbol: "NT$", locale: "zh-TW" },
  MYR: { code: "MYR", symbol: "RM", locale: "ms-MY" },
  IDR: { code: "IDR", symbol: "Rp", locale: "id-ID" },
  VND: { code: "VND", symbol: "₫", locale: "vi-VN" },
  PHP: { code: "PHP", symbol: "₱", locale: "en-PH" },
  INR: { code: "INR", symbol: "₹", locale: "en-IN" },
  NZD: { code: "NZD", symbol: "NZ$", locale: "en-NZ" },
  BRL: { code: "BRL", symbol: "R$", locale: "pt-BR" },
  MXN: { code: "MXN", symbol: "MX$", locale: "es-MX" },
  SEK: { code: "SEK", symbol: "kr", locale: "sv-SE" },
  NOK: { code: "NOK", symbol: "kr", locale: "nb-NO" },
  DKK: { code: "DKK", symbol: "kr", locale: "da-DK" },
};

const CURRENCY_STORAGE_KEY = "user-currency";

export function getUserCurrency(): string {
  if (typeof window === "undefined") return "USD";
  return localStorage.getItem(CURRENCY_STORAGE_KEY) || detectCurrencyFromLocale();
}

export function setUserCurrency(currency: string): void {
  localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
}

function detectCurrencyFromLocale(): string {
  try {
    const locale = navigator.language || "en-US";
    const region = locale.split("-")[1]?.toUpperCase();
    
    const regionToCurrency: Record<string, string> = {
      US: "USD", GB: "GBP", EU: "EUR", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR",
      JP: "JPY", CN: "CNY", KR: "KRW", AU: "AUD", CA: "CAD", CH: "CHF",
      TH: "THB", SG: "SGD", HK: "HKD", TW: "TWD", MY: "MYR", ID: "IDR",
      VN: "VND", PH: "PHP", IN: "INR", NZ: "NZD", BR: "BRL", MX: "MXN",
      SE: "SEK", NO: "NOK", DK: "DKK",
    };
    
    return regionToCurrency[region] || "USD";
  } catch {
    return "USD";
  }
}

export function formatCurrency(amount: number, currencyCode?: string): string {
  const code = currencyCode || getUserCurrency();
  const config = CURRENCIES[code] || CURRENCIES.USD;
  
  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.code,
      minimumFractionDigits: code === "JPY" || code === "KRW" || code === "VND" ? 0 : 2,
      maximumFractionDigits: code === "JPY" || code === "KRW" || code === "VND" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currencyCode?: string): string {
  const code = currencyCode || getUserCurrency();
  return CURRENCIES[code]?.symbol || "$";
}
