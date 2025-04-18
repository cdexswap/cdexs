'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import React from 'react';

export default function SupportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // TODO: Implement API endpoint for support
      console.log({ email, subject, details });
      alert('Support request sent successfully');
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending support request:', error);
      alert('Error sending support request. Please try again.');
    }
  };

  return (
    <>
      {/* Support Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-[8rem] sm:right-24 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-[150]"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className="w-6 h-6"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      </button>

      {/* Support Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150]">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-100">Support</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Subject Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter subject"
                  required
                />
              </div>

              {/* Details Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Details
                </label>
                <textarea
                  value={details}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDetails(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                  placeholder="Enter your message"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 font-medium"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
