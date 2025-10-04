import React, { useState } from 'react';
import { Upload, FileText, Briefcase } from 'lucide-react';
import { Button } from './button';
import { FileUpload } from './file-upload';
import { TextArea } from './text-area';

export const ResumeAnalyzer = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');

  const handleAnalyze = () => {
    // This is where you'll add your backend logic
    console.log('Resume:', resumeFile);
    console.log('Job Description:', jobDescription);
    alert('Ready to send to backend!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Resume Analyzer
          </h1>
          <p className="text-gray-600">Upload your resume and paste the job description to get started</p>
        </div>

        {/* Upload and Input Sections */}
        <div className="space-y-6 mb-8">
          <FileUpload onFileSelect={setResumeFile} file={resumeFile} />
          
          <TextArea
            value={jobDescription}
            onChange={setJobDescription}
            placeholder="Paste the job description here..."
            label="Job Description"
            icon={Briefcase}
          />
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={!resumeFile || !jobDescription.trim()}
          >
            Analyze Resume
          </Button>
        </div>
      </div>
    </div>
  );
}