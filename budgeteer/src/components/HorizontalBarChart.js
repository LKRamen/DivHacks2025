import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const spendingData = [
  { name: "Shopping", value: 63 },
  { name: "Food & Dining", value: 46 },
  { name: "Savings & Investment", value: 25 },
  { name: "Entertainment", value: 20 },
  { name: "Miscellaneous", value: 20 },
  { name: "Bills & Subscriptions", value: 15 },
  { name: "Health & Fitness", value: 10 },
  { name: "Transportation", value: 2.9 },
];

const COLORS = [
  "#df84a8", // pink
  "#c08eda", // purple
  "#4eb9c9", // teal
  "#5e9fe8", // blue
  "#72bc8f", // green
  "#ebc16b", // yellow 
  "#de9256", // orange
  "#e97266", // red
];

function HorizontalBarChart() {
  return (
    <div className="bg-white rounded-2xl border p-6">
      <h2 className="text-lg font-semibold mb-4">Category Breakdown</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={spendingData}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
        >
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={150} />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {spendingData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default HorizontalBarChart;
