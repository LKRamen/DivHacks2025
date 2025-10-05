import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "#df84a8", // pink
  "#c08eda", // purple
  "#5e9fe8", // blue
  "#4eb9c9", // teal
  "#72bc8f", // green
  "#ebc16b", // yellow 
  "#de9256", // orange
  "#e97266", // red
];

function DonutChart({ data }) {
  const [activeIndex, setActiveIndex] = useState(null);

  // Fallback data if no real data is provided
  const defaultData = [
    { name: "Shopping", value: 63 },
    { name: "Food & Dining", value: 46 },
    { name: "Savings & Investment", value: 25 },
    { name: "Entertainment", value: 20 },
    { name: "Miscellaneous", value: 20 },
    { name: "Bills & Subscriptions", value: 15 },
    { name: "Health & Fitness", value: 10 },
    { name: "Transportation", value: 2.9 },
  ];

  // Transform real data into chart format
  let spendingData = defaultData;
  let total = defaultData.reduce((acc, curr) => acc + curr.value, 0);

  if (data && data.categoryTotals) {
    spendingData = Object.entries(data.categoryTotals)
      .filter(([_, value]) => value > 0) // Only show categories with spending
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending

    total = data.totalSpending;
  }

  return (
    <div className="bg-[#2a2a30] rounded-2xl border border-gray-700 p-6">

      <h2 className="text-lg font-semibold mb-4 text-center">Total Spending</h2>

      {/* This wrapper is key: relative + fixed height */}
      <div className="relative w-full" style={{ height: "350px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={spendingData}
              dataKey="value"
              innerRadius={120}
              outerRadius={150}
              paddingAngle={0.5}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {spendingData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke={index === activeIndex ? "#fff" : "none"}
                  strokeWidth={index === activeIndex ? 4 : 0}
                  style={{
                    filter: index === activeIndex ? "brightness(1.2)" : "none",
                    transition: "all 0.2s ease-in-out",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`$${value}`, name]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                backgroundColor: "white",
                color: "#111827",
                fontSize: "14px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centered text inside the donut */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
          {activeIndex !== null ? (
            <>
              <span className="text-xl font-bold">
                {spendingData[activeIndex].name}
              </span>
              <span className="text-gray-400">
                ${spendingData[activeIndex].value}
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold">${total.toFixed(2)}</span>
              <span className="text-gray-400 text-sm">Total Amount</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DonutChart;