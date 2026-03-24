"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
// import { supabase } from "@/lib/supabase";
import { useSupabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Loader2, ListChecks, Wallet, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const supabase = useSupabase();
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

    // Initial fetch with retry + safety
    const fetchInitialBalance = async () => {
      setLoadingBalance(true);
      setFetchError(null);

      let attempts = 0;
      const maxAttempts = 3;
      let finalData = null;
      let finalError = null;

      while (attempts < maxAttempts) {
        attempts++;
        const { data, error } = await supabase
          .from("users")
          .select("diamonds_balance")
          .eq("id", userId)
          .maybeSingle();

        console.log(`Balance fetch attempt ${attempts}:`, { data, error });

        if (!error) {
          finalData = data;
          break;
        }

        finalError = error;
        await new Promise((r) => setTimeout(r, 1500));
      }

      if (finalError) {
        console.error("Final balance fetch error:", finalError);

        if (finalError.code === "42501") {
          setFetchError("Permission denied (RLS issue) - contact support");
        } else if (finalError.code === "PGRST116") {
          setFetchError("No user profile found - syncing...");
        } else {
          setFetchError("Failed to load balance");
        }
      }

      setBalance(finalData?.diamonds_balance ?? 0);
      setLoadingBalance(false);
    };

    fetchInitialBalance();

    // Realtime subscription (kept as-is, very reliable)
    const channel = supabase
      .channel("dashboard-balance-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          const reportedBalance = (payload.new as any)?.diamonds_balance ?? 0;
          console.log("Realtime UPDATE received:", reportedBalance, payload);

          let finalBalance = 0;
          for (let attempt = 1; attempt <= 3; attempt++) {
            await new Promise((r) => setTimeout(r, 1500 * attempt));

            const { data, error } = await supabase
              .from("users")
              .select("diamonds_balance")
              .eq("id", userId)
              .maybeSingle();

            if (error) continue;

            finalBalance = data?.diamonds_balance ?? 0;
            console.log(`Post-realtime re-fetch attempt ${attempt}:`, finalBalance);

            if (finalBalance >= reportedBalance) break;
          }

          setBalance(finalBalance);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          console.log("Realtime INSERT received:", payload);
          // Re-fetch balance after insert
          const { data } = await supabase
            .from("users")
            .select("diamonds_balance")
            .eq("id", userId)
            .maybeSingle();

          setBalance(data?.diamonds_balance ?? 0);
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Realtime successfully subscribed!");
        } else if (status === "CLOSED") {
          console.warn("Realtime channel closed");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Realtime channel error");
        }
      });

    return () => {
      console.log("Unsubscribing realtime channel");
      supabase.removeChannel(channel);
    };
  }, [isLoaded, user, supabase]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">
          Welcome to your Partivox Dashboard, {user?.firstName || user?.username || "User"}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Diamonds Balance – with safety & error display */}
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
                  <p className="text-sm text-gray-500 mt-1">
                    Balance may be temporarily unavailable
                  </p>
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
                  <Link href="/dashboard/buy-diamonds">Buy Diamonds</Link>
                </Button>
              </div>
            )}

            <p className="text-gray-400 text-sm mt-1">Earn by engaging or buy more</p>
          </div>

          {/* Withdraw */}
          <Link href="/dashboard/withdraw" className="block">
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-[#caf403] transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="h-6 w-6 text-[#caf403]" />
                  <h3 className="text-xl font-semibold">Withdraw</h3>
                </div>
                <p className="text-gray-400 text-sm">Convert diamonds to USDT</p>
              </div>
              <Button
                variant="outline"
                className="mt-4 border-[#caf403] text-black hover:bg-white"
              >
                Withdraw Now
              </Button>
            </div>
          </Link>

          {/* My Campaigns */}
          <Link href="/dashboard/my-campaigns" className="block">
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-[#caf403] transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-6 w-6 text-[#caf403]" />
                  <h3 className="text-xl font-semibold">My Campaigns</h3>
                </div>
                <p className="text-gray-400 text-sm">View and manage your created campaigns</p>
              </div>
              <Button
                variant="outline"
                className="mt-4 border-[#caf403] text-black hover:bg-white"
              >
                View Campaigns
              </Button>
            </div>
          </Link>

          {/* My Claims */}
          <Link href="/dashboard/my-claims" className="block">
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 hover:border-[#caf403] transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <ListChecks className="h-6 w-6 text-[#caf403]" />
                  <h3 className="text-xl font-semibold">My Claims</h3>
                </div>
                <p className="text-gray-400 text-sm">Track your submitted claims and earnings</p>
              </div>
              <Button
                variant="outline"
                className="mt-4 border-[#caf403] text-black hover:bg-white"
              >
                View Claims
              </Button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}