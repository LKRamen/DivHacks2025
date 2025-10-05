import React, { useEffect, useState, useMemo } from "react";

function BudgetingTips({ tips, profile, spendingData }) {
  const [aiTips, setAiTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultTips = [
    "Track your subscriptions monthly.",
    "Set aside at least 20% of income for savings.",
    "Use cash for discretionary spending to limit overspending.",
    "Review categories with high spending each week."
  ];

  // Build system prompt based on profile and spending data
  const systemPrompt = useMemo(() => {
    if (!spendingData || !profile) return null;

    const categories = spendingData.categoryTotals
      ? Object.entries(spendingData.categoryTotals)
          .map(([name, value]) => `${name}: $${value.toFixed(2)}`)
          .join(", ")
      : "No category data";

    const totalSpending = spendingData.totalSpending || 0;
    const userGoals = profile?.survey?.goals || [];
    const focusCategories = profile?.survey?.focus_categories || [];
    const nudges = profile?.survey?.nudges || [];
    const timeHorizon = profile?.survey?.time_horizon || [];

    // Find top spending categories
    const topCategories = spendingData.categoryTotals
      ? Object.entries(spendingData.categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name)
      : [];

    return [
      "You are a financial advisor providing personalized budgeting tips for a student.",
      "Generate exactly 4 specific, actionable tips based on the user's spending patterns and goals.",
      "Each tip should be one clear sentence. Be direct and practical.",
      "Focus on their highest spending categories and align tips with their stated goals.",
      `Current spending: Total=$${totalSpending.toFixed(2)}`,
      `Top spending categories: ${topCategories.join(", ")}`,
      `All categories: ${categories}`,
      userGoals.length > 0 ? `User's goals: ${userGoals.join(", ")}` : "",
      focusCategories.length > 0 ? `Focus areas: ${focusCategories.join(", ")}` : "",
      nudges.length > 0 ? `User preferences: ${nudges.join(", ")}` : "",
      timeHorizon.length > 0 ? `Planning horizon: ${timeHorizon.join(", ")}` : "",
      "Make tips relevant to students (meal prep, student discounts, splitting costs, etc.).",
      "Format: Return only the 4 tips, each on a new line, no numbering or bullets.",
    ].filter(Boolean).join("\n");
  }, [spendingData, profile]);

  // Generate AI tips on mount or when dependencies change
  useEffect(() => {
    if (!systemPrompt || !spendingData || !profile) {
      setLoading(false);
      return;
    }

    const generateTips = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system: systemPrompt,
            context: {
              categories: spendingData.categoryTotals
                ? Object.entries(spendingData.categoryTotals).map(([name, value]) => ({
                    name,
                    value,
                  }))
                : [],
              balance: spendingData.totalSpending,
              month: new Date().toLocaleString("default", { month: "long" }),
            },
            messages: [
              {
                role: "user",
                content:
                  "Give me 4 personalized budgeting tips based on my spending patterns and goals. Make them specific to my situation.",
              },
            ],
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || `Failed to generate tips: ${res.status}`);

        // Parse the AI response into individual tips
        const tipsArray = data.reply
          .split("\n")
          .map(tip => tip.trim())
          .filter(tip => tip.length > 0 && !tip.match(/^(tip|-)?\s*\d+[.:)]/i)) // Remove numbering if present
          .map(tip => tip.replace(/^[-•]\s*/, "")) // Remove bullet points
          .slice(0, 4); // Ensure exactly 4 tips

        setAiTips(tipsArray);
      } catch (err) {
        console.error("Error generating AI tips:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    generateTips();
  }, [systemPrompt, spendingData, profile]);

  // Determine which tips to display
  const displayTips = tips && tips.length > 0 
    ? tips 
    : aiTips.length > 0 
    ? aiTips 
    : defaultTips;

  return (
    <div className="bg-[#2a2a30] rounded-2xl border border-gray-700 p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">
        Budgeting Tips
        {loading && <span className="text-xs text-gray-400 ml-2">(generating...)</span>}
      </h2>
      
      {error ? (
        <div className="flex-1">
          <p className="text-red-400 text-sm mb-2">Unable to generate personalized tips</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 flex-1">
            {defaultTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : displayTips.length > 0 ? (
        <ul className="list-disc list-inside text-gray-300 space-y-2 flex-1">
          {displayTips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No tips available yet.</p>
      )}
    </div>
  );
}

export default BudgetingTips;