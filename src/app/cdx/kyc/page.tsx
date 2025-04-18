"use client";

import { useState } from 'react';
import Image from 'next/image';

export default function KYCPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        setMessage({ type: 'error', text: 'Please upload a JPG or PNG file' });
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a passport image first' });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setMessage({ type: 'success', text: 'Passport uploaded successfully! Your KYC is under review.' });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload passport. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">KYC Verification</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-100">Upload Passport</h2>
          <p className="text-gray-400 mb-4">Please upload a clear image of your passport. We accept JPG and PNG formats.</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:border-gray-500">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={previewUrl}
                        alt="Passport preview"
                        width={300}
                        height={200}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG or JPG</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`w-full py-2 px-4 rounded-lg font-medium ${
                !selectedFile || isUploading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload Passport'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
