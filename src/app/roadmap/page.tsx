'use client';

import Image from 'next/image';
import useWindowSize from '@/hooks/useWindowSize';

const RoadmapPage = () => {
  const { width } = useWindowSize();
  const isMobile = width < 768; // md breakpoint
  const roadmapData = [
    {
      quarter: "Q1",
      icon: "user-edit",
      items: [
        {
          title: "P2P (Decentralized)",
          type: "feature"
        },
        {
          title: "$CDXG Token Presale",
          type: "service"
        },
        {
          title: "$CDX Token Presale Launch on Raydium",
          type: "roadmap"
        },
        {
          title: "CDEXS Web 3.0 Launch",
          type: "development"
        }
      ]
    },
    {
      quarter: "Q2",
      icon: "chat",
      items: [
        {
          title: "TRX & SOL P2P Trading",
          type: "feature"
        },
        {
          title: "Listing Token Service",
          type: "service"
        },
        {
          title: "$CDX Launch on Top Tire Exchange",
          type: "roadmap"
        },
        {
          title: "Tokenomics Ecosystem",
          type: "development"
        }
      ]
    },
    {
      quarter: "Q3",
      icon: "users",
      items: [
        {
          title: "E-Commerce",
          type: "feature"
        },
        {
          title: "Market Place & NFT",
          type: "service"
        },
        {
          title: "$CDX Ecosystem Spending on CDEXS",
          type: "roadmap"
        },
        {
          title: "AI Development",
          type: "development"
        }
      ]
    },
    {
      quarter: "Q4",
      icon: "star",
      items: [
        {
          title: "Spot (Decentralized)",
          type: "feature"
        },
        {
          title: "Booking Service",
          type: "service"
        },
        {
          title: "$CDX Token 100% Unlock",
          type: "roadmap"
        },
        {
          title: "Top Tire CEX Partner",
          type: "development"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1200px] w-full mx-auto px-6 md:px-8 lg:px-12 py-6 md:py-8">
        {isMobile ? (
          <>
            <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-8">
          <Image src="/logo.png" alt="CDEX SWAP" width={40} height={40} className="md:w-[60px] md:h-[60px]" />
          <h1 className="text-2xl md:text-4xl font-bold">CDEX SWAP</h1>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-12">Road Map : 2025</h2>

            <div className="relative">
          {/* Legend */}
          <div className="grid grid-cols-2 md:flex md:gap-8 gap-4 justify-start md:justify-end mb-8 md:mb-12 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6B8E7B]"></div>
              <span>Features</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E8D5C4]"></div>
              <span>Services</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#7D8DA7]"></div>
              <span>$CDX Road Map</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F5F5F5]"></div>
              <span>Development</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex flex-col md:flex-row justify-between relative gap-8 md:gap-4">
            {/* Dotted line connecting the quarters - hidden on mobile */}
            <div className="absolute top-[60px] left-[60px] right-[60px] border-t-2 border-dotted border-gray-600 z-0 hidden md:block"></div>

            {roadmapData.map((quarter, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center max-w-[280px] mx-auto md:mx-0">
                {/* Icon Circle */}
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mb-4 
                  ${quarter.icon === 'user-edit' ? 'bg-[#3C4B44]' : 
                    quarter.icon === 'chat' ? 'bg-[#6B8E7B]' : 
                    quarter.icon === 'users' ? 'bg-[#3C4B44]' : 'bg-[#3C4B44]'}`}>
                  <div className="text-white scale-75 md:scale-100">
                    {quarter.icon === 'user-edit' && (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                      </svg>
                    )}
                    {quarter.icon === 'chat' && (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill="currentColor"/>
                      </svg>
                    )}
                    {quarter.icon === 'users' && (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                      </svg>
                    )}
                    {quarter.icon === 'star' && (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                      </svg>
                    )}
                  </div>
                </div>

                {/* Quarter Label */}
                <div className="text-lg md:text-xl font-bold mb-4">{quarter.quarter}</div>

                {/* Items */}
                <div className="space-y-2 w-full">
                  {quarter.items.map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className={`py-2 px-3 md:px-4 rounded-full text-center text-xs md:text-sm whitespace-normal
                        ${item.type === 'feature' ? 'bg-[#6B8E7B]' :
                          item.type === 'service' ? 'bg-[#E8D5C4] text-black' :
                          item.type === 'development' ? 'bg-[#F5F5F5] text-black' : 'bg-[#7D8DA7]'}`}
                    >
                      {item.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
            </div>

            {/* Website URL */}
            <div className="text-center mt-8 md:mt-12">
              <a href="https://www.cdexs.com" className="text-white hover:text-gray-300 text-sm md:text-base">
                www.cdexs.com
              </a>
            </div>
          </>
        ) : (
          <div className="relative w-full">
            <Image
              src="/roadmap.png"
              alt="CDEX SWAP Roadmap 2025"
              width={1200}
              height={800}
              className="w-full h-auto"
              priority
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapPage;
