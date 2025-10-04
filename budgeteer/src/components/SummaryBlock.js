import React from "react";

function SummaryBlock({ summary }) {
  return (
    <div className="bg-[#2a2a30] rounded-2xl border border-gray-700 p-6">
      <h2 className="text-lg font-semibold mb-4">Summary From Budgeteer</h2>
      <p className="text-gray-400 leading-relaxed">
        {summary && summary.trim().length > 0
          ? summary
          : "No summary available for the current data."}
      </p>
    </div>
  );
}

export default SummaryBlock;
