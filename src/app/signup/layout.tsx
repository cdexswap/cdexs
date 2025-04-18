import type { Metadata } from "next";
import WalletProvider from "@/components/providers/WalletProvider";

export const metadata: Metadata = {
  title: "CDEX SWAP",
  description: "CDEX SWAP",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-black">
      <WalletProvider suppressNavbar={true}>
        {children}
      </WalletProvider>
    </div>
  );
}
