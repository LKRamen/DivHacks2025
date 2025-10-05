import { useMemo } from "react";

/**
 * Convert your chart/category arrays into a compact context object for the chatbot.
 * Pass in whatever you currently show on charts.
 */
export function useSpendingContext({ categories, balance, goal, month }) {
  const ctx = useMemo(() => {
    const safeCats =
      (categories || [])
        .filter(Boolean)
        .map((c) => ({ name: String(c.name), value: Number(c.value) })) || [];

    return {
      categories: safeCats,
      balance: typeof balance === "number" ? balance : undefined,
      goal: typeof goal === "number" ? goal : undefined,
      month: month || undefined,
    };
  }, [categories, balance, goal, month]);

  return ctx;
}
