"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Loader2, ListChecks, Wallet, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user?.id) {
      setLoadingBalance(false);
      setBalance(0);
      return;
    }

    const userId = user.id;

    const fetchInitialBalance = async () => {
      setLoadingBalance(true);
      setFetchError(null);

      console.log("Dashboard: Starting balance fetch for user:", userId);

      try {
        // Get fresh Clerk token for Supabase
        const token = await getToken({ template: "supabase" });
        console.log("Clerk token received:", token ? "Yes (length: " + token.length + ")" : "No token");

        if (!token) {
          throw new Error("No token from Clerk");
        }

        // Create Supabase client with Clerk token
        const supabaseWithToken = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );

        let attempts = 0;
        const maxAttempts = 4;
        let finalData = null;
        let finalError = null;

        while (attempts < maxAttempts) {
          attempts++;
          const { data, error } = await supabaseWithToken
            .from("users")
            .select("diamonds_balance")
            .eq("id", userId)
            .maybeSingle();

          console.log(`Balance fetch attempt ${attempts}:`, { 
            data: data ? { diamonds_balance: data.diamonds_balance } : null, 
            error: error ? { code: error.code, message: error.message } : null 
          });

          if (!error && data !== null) {
            finalData = data;
            break;
          }

          finalError = error;
          await new Promise((r) => setTimeout(r, 1000));
        }

        if (finalError) {
          console.error("Final balance fetch error:", finalError);
          if (finalError.code === "42501") {
            setFetchError("Permission denied (RLS). Please refresh.");
          } else {
            setFetchError("Failed to load balance.");
          }
        } else {
          console.log("Balance loaded successfully:", finalData?.diamonds_balance);
        }

        setBalance(finalData?.diamonds_balance ?? 0);
      } catch (err: any) {
        console.error("Balance fetch failed:", err);
        setFetchError("Authentication or fetch error. Please refresh.");
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchInitialBalance();

    // Realtime subscription (simplified)
    const channel = supabase
      .channel("dashboard-balance-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          fetchInitialBalance();
          console.log("Realtime balance update:", payload.new);
          setBalance((payload.new as any)?.diamonds_balance ?? 0);
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoaded, user, getToken]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">
          Welcome to your Partivox Dashboard, {user?.firstName || user?.username || "User"}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Diamonds Balance */}
          <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-xl font-semibold mb-2">Diamonds Balance</h3>

            {loadingBalance ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#caf403]" />
                <p className="text-3xl font-bold text-[#caf403]">Loading...</p>
              </div>
            ) : fetchError ? (
              <div className="flex items-center gap-3 text-yellow-400">
                <AlertCircle className="h-6 w-6" />
                <div>
                  <p className="font-medium">{fetchError}</p>
                  <p className="text-sm text-gray-500 mt-1">Try refreshing the page</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <p className="text-3xl font-bold text-[#caf403]">
                  {balance ?? 0}
                </p>
                <Button
                  asChild
                  className="bg-[#caf403] hover:bg-[#b0e000] text-black px-6 py-2 rounded-full font-semibold"
                >
                  <Link href="/dashboard_user/buy-diamonds">Buy Diamonds</Link>
                </Button>
              </div>
            )}

            <p className="text-gray-400 text-sm mt-1">Earn by engaging or buy more</p>
          </div>

          {/* Withdraw */}
          <Link href="/dashboard_user/withdraw" className="block">
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-[#caf403] transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="h-6 w-6 text-[#caf403]" />
                  <h3 className="text-xl font-semibold">Withdraw</h3>
                </div>
                <p className="text-gray-400 text-sm">Convert diamonds to USDT</p>
              </div>
              <Button variant="outline" className="mt-4 border-[#caf403] text-black hover:bg-white">
                Withdraw Now
              </Button>
            </div>
          </Link>

          {/* My Campaigns */}
          <Link href="/dashboard_user/my-campaigns" className="block">
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-[#caf403] transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-6 w-6 text-[#caf403]" />
                  <h3 className="text-xl font-semibold">My Campaigns</h3>
                </div>
                <p className="text-gray-400 text-sm">View and manage your created campaigns</p>
              </div>
              <Button variant="outline" className="mt-4 border-[#caf403] text-black hover:bg-white">
                View Campaigns
              </Button>
            </div>
          </Link>

          {/* My Claims */}
          <Link href="/dashboard_user/my-claims" className="block">
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-[#caf403] transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ListChecks className="h-6 w-6 text-[#caf403]" />
                  <h3 className="text-xl font-semibold">My Claims</h3>
                </div>
                <p className="text-gray-400 text-sm">Track your submitted claims and earnings</p>
              </div>
              <Button variant="outline" className="mt-4 border-[#caf403] text-black hover:bg-white">
                View Claims
              </Button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}