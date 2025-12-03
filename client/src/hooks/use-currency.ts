import { useState, useEffect, useCallback } from "react";
import { getUserCurrency, setUserCurrency, formatCurrency, getCurrencySymbol, CURRENCIES } from "@/lib/currency";

const CURRENCY_CHANGE_EVENT = "currency-change";

export function useCurrency() {
  const [currency, setCurrency] = useState(getUserCurrency);

  useEffect(() => {
    const handleChange = () => setCurrency(getUserCurrency());
    window.addEventListener(CURRENCY_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CURRENCY_CHANGE_EVENT, handleChange);
  }, []);

  const updateCurrency = useCallback((newCurrency: string) => {
    setUserCurrency(newCurrency);
    setCurrency(newCurrency);
    window.dispatchEvent(new Event(CURRENCY_CHANGE_EVENT));
  }, []);

  const format = useCallback((amount: number) => formatCurrency(amount, currency), [currency]);
  const symbol = getCurrencySymbol(currency);

  return {
    currency,
    setCurrency: updateCurrency,
    format,
    symbol,
    currencies: CURRENCIES,
  };
}
