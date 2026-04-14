"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Optional: redirect if not signed in (middleware already handles, this is fallback)
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // You can add router.push("/sign-in") here if you want double protection
      // But middleware already redirects, so this is mostly for UI
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#caf403]" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-6">Welcome to Partivox Dashboard</h1>
          <p className="text-xl text-gray-300 mb-10">
            Please sign in to access your dashboard, campaigns, tasks, and wallet.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-[#caf403] hover:bg-[#b0e000] text-black text-lg px-10 py-6 rounded-full font-bold"
          >
            <Link href="/sign-in">
              Sign In or Create Account
            </Link>
          </Button>
          <p className="text-gray-500 mt-8 text-sm">
            New here? Signing up is free and takes 10 seconds.
          </p>
        </div>
      </div>
    );
  }

  // Signed-in user → show full dashboard layout
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1a1a] border-r border-gray-800 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
        `}
      >
        <div className="p-6">
          {/* <a href="http://localhost:3000/" className="text-2xl font-bold text-[#caf403] mb-10">Partivox</a> */}
          <h2 className="text-2xl font-bold text-[#caf403] mb-10">Partivox</h2>

          <nav className="space-y-2">
            <Link
              href="/dashboard_user"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition"
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="text-xl">🏠</span>
              <span>Dashboard</span>
            </Link>

            <Link
              href="/dashboard_user/campaigns"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition"
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="text-xl">🚀</span>
              <span>Create Campaign</span>
            </Link>

            <Link
              href="/dashboard_user/tasks"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition"
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="text-xl">✅</span>
              <span>Task Feed</span>
            </Link>

            <Link
              href="/dashboard_user/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition"
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="text-xl">⚙️</span>
              <span>Settings</span>
            </Link>

            {/* Admin links – visible to everyone, but middleware protects */}
            {/* <Link
              href="/dashboard/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition text-yellow-400 hover:text-yellow-300"
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="text-xl">🛡️</span>
              <span>Admin</span>
            </Link> */}

            
          </nav>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-[#1a1a1a] border-b border-gray-800 p-4 flex items-center justify-between">
          <button
            className="md:hidden text-white text-2xl"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white">🔔</button>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userPreviewMainIdentifier: "text-white",
                  userPreviewSecondaryIdentifier: "text-gray-400",
                },
              }}
            />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
          <Toaster />
        </main>
      </div>
    </div>
  );
}