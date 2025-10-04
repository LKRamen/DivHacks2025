import React from "react";
import "./App.css";
import DonutChart from "./components/DonutChart";
import HorizontalBarChart from "./components/HorizontalBarChart";

function App() {
  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Budgeteer Dashboard</h1>
      <div className="grid grid-cols-2 gap-8">
        <DonutChart />
        <HorizontalBarChart />
      </div>
    </div>
  );
}

export default App;
