import React from "react";

function BudgetingTips({ tips }) {
  const defaultTips = [
    "Track your subscriptions monthly.",
    "Set aside at least 20% of income for savings.",
    "Use cash for discretionary spending to limit overspending.",
    "Review categories with high spending each week."
  ];

  const displayTips = tips && tips.length > 0 ? tips : defaultTips;

  return (
    <div className="bg-[#2a2a30] rounded-2xl border border-gray-700 p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Budgeting Tips</h2>
      {displayTips.length > 0 ? (
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
