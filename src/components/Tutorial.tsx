"use client";

import React, { useState, useEffect, useRef } from 'react';

interface TutorialStep {
  element: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialProps {
  show: boolean;
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ show, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elementPosition, setElementPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const steps: TutorialStep[] = [
    {
      element: '[data-tutorial="wallet-connect"]',
      title: 'Connect Wallet',
      description: 'Connect your wallet to start trading on our platform',
      position: 'bottom'
    },
    {
      element: '[data-tutorial="buy-nav"]',
      title: 'Start Trading',
      description: 'Ready to buy? Head to our trading page to view available offers',
      position: 'bottom'
    },
    {
      element: '[data-tutorial="settings"]',
      title: 'Open Your Shop',
      description: 'Set up your shop details and payment methods to start selling',
      position: 'top'
    },
    {
      element: '[data-tutorial="sell-nav"]',
      title: 'Start Selling',
      description: 'After setting up your shop, head to the sell page to create your offers',
      position: 'bottom'
    }
  ];

  // Update window dimensions
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Initial dimensions
    updateDimensions();

    // Update dimensions on resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!show) return;

    const updateElementPosition = () => {
      const element = document.querySelector(steps[currentStep].element);
      if (!element) return;

      // Wait for next frame to ensure element is properly positioned
      requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        
        // Ensure the element is actually visible in viewport
        if (rect.width > 0 && rect.height > 0) {
          setElementPosition({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });

          // Add highlight to current element
          element.classList.add('tutorial-target');
        }
      });
    };

    // Initial update
    updateElementPosition();

    // Update on resize
    window.addEventListener('resize', updateElementPosition);

    // Update position periodically for first few seconds
    // This helps with dynamic content that might shift layout
    const interval = setInterval(updateElementPosition, 100);
    setTimeout(() => clearInterval(interval), 2000);

    return () => {
      window.removeEventListener('resize', updateElementPosition);
      clearInterval(interval);
      document.querySelectorAll('.tutorial-target').forEach(el => {
        el.classList.remove('tutorial-target');
      });
    };
  }, [currentStep, show, steps]);

  if (!show) return null;

  const currentTutorial = steps[currentStep];
  const padding = 4; // Padding around the highlighted element in pixels
  // Calculate tooltip width based on screen size
  const tooltipWidth = dimensions.width <= 768 ? Math.min(300, dimensions.width - 32) : 400;
  const margin = 16; // Margin from viewport edges

  // Only calculate tooltip position if element is properly positioned
  const tooltipPosition = elementPosition.width > 0 ? {
    top: currentTutorial.position === 'top'
      ? Math.max(elementPosition.top - 20, margin) // Ensure tooltip doesn't go above viewport
      : Math.min(elementPosition.top + elementPosition.height + 20, dimensions.height - margin), // Ensure tooltip doesn't go below viewport
    left: Math.min(
      Math.max(
        elementPosition.left + (elementPosition.width / 2) - (tooltipWidth / 2),
        margin
      ),
      dimensions.width - tooltipWidth - margin
    )
  } : { top: 0, left: 0 };

  // Only render the component after dimensions are set
  if (dimensions.width === 0 || dimensions.height === 0) return null;

  return (
    <div className="fixed inset-0 z-[140]">
      {/* Dark overlay with spotlight effect */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/80 transition-opacity duration-300"
        style={{
          clipPath: `path('M 0,0 v ${dimensions.height} h ${dimensions.width} v -${dimensions.height} h -${dimensions.width} Z M ${elementPosition.left - padding},${elementPosition.top - padding} h ${elementPosition.width + padding * 2} v ${elementPosition.height + padding * 2} h -${elementPosition.width + padding * 2} Z')`
        }}
      />

      {/* Highlight border */}
      <div 
        className="absolute border-2 border-blue-500 transition-all duration-300 pointer-events-none"
        style={{
          top: elementPosition.top - padding,
          left: elementPosition.left - padding,
          width: elementPosition.width + padding * 2,
          height: elementPosition.height + padding * 2,
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5)',
          animation: 'spotlight-pulse 2s infinite'
        }}
      />

      {/* Tutorial tooltip */}
      <div 
        className="absolute transform -translate-x-1/2 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl p-4 sm:p-6 pointer-events-auto border border-gray-100"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: tooltipWidth,
          transform: `translateY(${currentTutorial.position === 'top' ? '-100%' : '0'})` // Move up when position is top
        }}
      >
        <div className="relative">
          {/* Arrow */}
          <div 
            className={`absolute w-4 h-4 bg-white transform rotate-45 left-1/2 -translate-x-1/2 ${
              currentTutorial.position === 'top' ? 'bottom-[-8px]' : '-top-2'
            }`}
            style={{
              boxShadow: currentTutorial.position === 'top' 
                ? '2px 2px 2px rgba(0, 0, 0, 0.05)'
                : '-2px -2px 2px rgba(0, 0, 0, 0.05)'
            }}
          />
          
          <div className="relative bg-transparent rounded-lg z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {currentTutorial.title}
              </h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed text-lg">
              {currentTutorial.description}
            </p>

            <div className="flex justify-between">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                >
                  Back
                </button>
              )}
              <div className="flex-1" />
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105"
                >
                  Got it!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .tutorial-target {
          position: relative;
          z-index: 141;
        }

        @keyframes spotlight-pulse {
          0% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
          }
          100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default Tutorial;
