import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AuthSync } from "@/components/AuthSync";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Partivox - Social Growth & Rewards",
  description: "Launch campaigns and earn from engagement",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-[#0d0d0d] text-white">
          <AuthSync />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}