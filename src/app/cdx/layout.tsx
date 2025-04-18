'use client';

import SideMenu from '@/components/cdx/SideMenu';
import useWindowSize from '@/hooks/useWindowSize';

export default function CdxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className={`flex ${isMobile ? 'flex-col' : ''}`}>
        <SideMenu isOpen={true} isMobile={isMobile} onClose={() => {}} />
        <main className={`flex-1 p-4 md:p-8 ${isMobile ? 'pt-16' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
