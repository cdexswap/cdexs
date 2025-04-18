import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CDXPopupProps {
  show: boolean;
  onClose: () => void;
}

const CDXPopup: React.FC<CDXPopupProps> = ({ show, onClose }) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  
  useEffect(() => {
    if (show) {
      // Trigger secondary animations after the main popup appears
      const timer = setTimeout(() => {
        setAnimationComplete(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setAnimationComplete(false);
    }
  }, [show]);
  
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="relative bg-gradient-to-br from-gray-900 via-blue-900/80 to-indigo-900/80 rounded-xl border border-blue-500/30 p-8 max-w-md w-full shadow-2xl shadow-blue-500/30 backdrop-blur-lg animate-fadeIn animate-glow overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 animate-shimmer"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 animate-shimmer"></div>
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex flex-col items-center relative z-10">
          <div className="w-40 h-40 mb-6 relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse-slow"></div>
            <div className={`relative z-10 animate-float transition-all duration-500 ${animationComplete ? 'opacity-100' : 'opacity-0'}`}>
              <Image
                src="/logo/PNG/CDX.webp"
                alt="CDX Token"
                width={160}
                height={160}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
          </div>
          
          <h2 className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4 text-center transition-all duration-500 ${animationComplete ? 'opacity-100' : 'opacity-0'}`}>
            CDX Token Now Available!
          </h2>
          
          <div className={`w-16 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 mb-4 transition-all duration-500 ${animationComplete ? 'opacity-100 w-16' : 'opacity-0 w-0'}`}></div>
          
          <p className={`text-gray-300 mb-8 text-center leading-relaxed transition-all duration-500 ${animationComplete ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}>
          Power up your P2P trades with next-level features and security.
</p>
          
          <div className={`w-full transition-all duration-500 ${animationComplete ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}>
            <a 
              href="https://cdx.cdexs.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center px-6 py-4 text-lg font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 w-full justify-center group"
            >
              <span>Buy CDX Token Now</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
          
          <div className={`mt-6 flex items-center justify-center space-x-1 transition-all duration-500 ${animationComplete ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-xs text-gray-400">Current price:</span>
            <span className="text-sm font-bold text-blue-400">$0.01 USD</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CDXPopup;
