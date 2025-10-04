import React from "react";
import DonutChart from "./components/DonutChart";
import HorizontalBarChart from "./components/HorizontalBarChart";
import SummaryBlock from "./components/SummaryBlock";

function App() {
  // Placeholder — eventually you’ll replace with Gemini API output
  const aiSummary = "";

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <DonutChart />
        <HorizontalBarChart />
      </div>

      {/* AI Summary Block */}
      <SummaryBlock summary={aiSummary} />
    </div>
  );
}

export default App;
