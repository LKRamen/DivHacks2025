import React from 'react';
import { Card } from "./card";

export const TextArea = ({ value, onChange, placeholder, label, icon: Icon }) => {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        {Icon && <Icon className="text-purple-600" size={24} />}
        <h2 className="text-xl font-semibold text-gray-800">{label}</h2>
      </div>
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
      />
    </Card>
  );
}; 