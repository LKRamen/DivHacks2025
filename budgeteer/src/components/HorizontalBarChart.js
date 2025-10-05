import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

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

function HorizontalBarChart({ data }) {
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

  if (data && data.categoryTotals) {
    spendingData = Object.entries(data.categoryTotals)
      .filter(([_, value]) => value > 0) // Only show categories with spending
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }

  return (
    <div className="bg-[#2a2a30] rounded-2xl border border-gray-700 p-6">

      <h2 className="text-lg font-semibold mb-4 text-center">Category Breakdown</h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={spendingData}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 50, bottom: 0 }}
        >
          <XAxis type="number" 
            tick={{ fill: "#d1d5db", fontSize: 12 }}   // 👈 gray-300
            axisLine={{ stroke: "#4b5563" }}           // 👈 gray-600 for the line
            tickLine={{ stroke: "#4b5563" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fill: "#d1d5db", fontSize: 12 }} 
          />
          <Tooltip
            formatter={(value, name) => [`$${value}`, name]}
            cursor={{ fill: 'transparent' }}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              backgroundColor: "white",
              color: "#111827",
              fontSize: "14px",
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 8, 8, 0]}
            activeBar={false}
            barSize={16}              
            barCategoryGap={25}  
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {spendingData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                style={{
                  filter: index === activeIndex ? "brightness(1.2)" : "none",
                  transition: "all 0.2s ease-in-out",
                  cursor: "pointer",
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default HorizontalBarChart;