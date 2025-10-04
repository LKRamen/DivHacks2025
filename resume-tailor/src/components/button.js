import React, { useState } from 'react';
import { Upload, FileText, Briefcase } from 'lucide-react';

export const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const baseStyles = 'px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 justify-center';
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};