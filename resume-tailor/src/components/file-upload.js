import React from 'react';
import { Card } from "./card";
import { Upload, FileText } from 'lucide-react';

export const FileUpload = ({ onFileSelect, file }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      onFileSelect(droppedFile);
    }
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <FileText className="text-blue-600" size={24} />
        <h2 className="text-xl font-semibold text-gray-800">Upload Resume</h2>
      </div>
      
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          {file ? (
            <div>
              <p className="text-green-600 font-medium mb-1">{file.name}</p>
              <p className="text-sm text-gray-500">Click or drag to replace</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 font-medium mb-1">Drop your resume here or click to browse</p>
              <p className="text-sm text-gray-500">PDF files only</p>
            </div>
          )}
        </label>
      </div>
    </Card>
  );
};