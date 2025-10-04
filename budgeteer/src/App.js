import React from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const spendingData = [
  { name: "Food", value: 400 },
  { name: "Transport", value: 300 },
  { name: "Shopping", value: 200 },
  { name: "Entertainment", value: 150 },
];

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"]; // muted Notion-like palette

function Dashboard() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Spending Dashboard</h1>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">Spending Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={spendingData} dataKey="value" outerRadius={80} label>
                {spendingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">Weekly Spending</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={spendingData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
