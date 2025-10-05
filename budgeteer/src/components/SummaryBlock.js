import React, { useEffect, useState, useMemo } from "react";

function SummaryBlock({ summary, profile, spendingData }) {
  const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    return [
      "You are a financial advisor providing a brief, encouraging summary of spending habits.",
      "Keep your response to 3-4 sentences maximum. Be specific and actionable.",
      "Focus on progress toward goals and provide one concrete suggestion for improvement.",
      `Current spending: Total=$${totalSpending.toFixed(2)}`,
      `Categories: ${categories}`,
      userGoals.length > 0 ? `User's goals: ${userGoals.join(", ")}` : "",
      focusCategories.length > 0 ? `Focus areas: ${focusCategories.join(", ")}` : "",
      nudges.length > 0 ? `User preferences: ${nudges.join(", ")}` : "",
      timeHorizon.length > 0 ? `Planning horizon: ${timeHorizon.join(", ")}` : "",
      "Acknowledge their goals and give personalized insight based on their spending patterns.",
    ].filter(Boolean).join("\n");
  }, [spendingData, profile]);

  // Generate AI summary on mount or when dependencies change
  useEffect(() => {
    if (!systemPrompt || !spendingData || !profile) {
      setLoading(false);
      return;
    }

    const generateSummary = async () => {
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
                  "Provide a brief summary of my spending this month and how I'm doing with my savings goals. Keep it encouraging and actionable.",
              },
            ],
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || `Failed to generate summary: ${res.status}`);

        setAiSummary(data.reply);
      } catch (err) {
        console.error("Error generating AI summary:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, [systemPrompt, spendingData, profile]);

  return (
    <div className="bg-[#2a2a30] rounded-2xl border border-gray-700 p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Summary From Budgeteer</h2>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Generating your personalized summary...</div>
        </div>
      ) : error ? (
        <div className="flex-1">
          <p className="text-red-400 text-sm mb-2">Unable to generate summary</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      ) : (
        <p className="text-gray-300 leading-relaxed flex-1">
          {aiSummary || summary || "No summary available for the current data."}
        </p>
      )}
    </div>
  );
}

export default SummaryBlock;