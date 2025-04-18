"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import WalletProvider from "./WalletProvider";
import SocketProvider from "./SocketProvider";
import { usePathname } from "next/navigation";

// Dynamically import modals to prevent hydration issues
const NotificationsModal = dynamic(() => import("../NotificationsModal"), {
  ssr: false,
});
const SettingsModal = dynamic(() => import("../SettingsModal"), { ssr: false });
const SupportModal = dynamic(() => import("../SupportModal"), { ssr: false });

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <SocketProvider>
      <WalletProvider>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Suspense fallback={null}>
          <SettingsModal />
          <SupportModal />
          <NotificationsModal />
        </Suspense>
      </WalletProvider>
    </SocketProvider>
  );
}
