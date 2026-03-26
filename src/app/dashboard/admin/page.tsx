"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const supabase = useSupabase();

  const [counts, setCounts] = useState({
    pendingCampaigns: 0,
    pendingClaims: 0,
    pendingPurchases: 0,
    pendingWithdrawals: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    setLoading(true);

    try {
      const [campaigns, claims, purchases, withdrawals] = await Promise.all([
        supabase
          .from("campaigns")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),

        supabase
          .from("claims")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),

        supabase
          .from("diamond_purchases")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),

        supabase
          .from("withdrawals")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      setCounts({
        pendingCampaigns: campaigns.count || 0,
        pendingClaims: claims.count || 0,
        pendingPurchases: purchases.count || 0,
        pendingWithdrawals: withdrawals.count || 0,
      });
    } catch (err) {
      console.error("Failed to fetch admin counts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Realtime subscriptions for pending counts
    const channels = [
      supabase
        .channel("admin-campaigns")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "campaigns" },
          () => fetchCounts()
        )
        .subscribe(),

      supabase
        .channel("admin-claims")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "claims" },
          () => fetchCounts()
        )
        .subscribe(),

      supabase
        .channel("admin-purchases")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "diamond_purchases" },
          () => fetchCounts()
        )
        .subscribe(),

      supabase
        .channel("admin-withdrawals")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "withdrawals" },
          () => fetchCounts()
        )
        .subscribe(),
    ];

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-[#caf403]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-400 mb-12">
        Manage and review pending items across the platform.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Campaigns */}
        <Link href="/dashboard/admin/campaigns" className="block">
          <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-800 hover:border-[#caf403] transition-all h-full flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-white">Pending Campaigns</h3>
                {counts.pendingCampaigns > 0 && (
                  <Badge className="bg-red-600 text-white text-lg px-4 py-1">
                    {counts.pendingCampaigns}
                  </Badge>
                )}
              </div>
              <p className="text-gray-400">
                Approve, reject or mark campaigns as completed.
              </p>
            </div>
            <Button className="mt-6 bg-[#caf403] hover:bg-[#b0e000] text-black">
              Review Campaigns
            </Button>
          </div>
        </Link>

        {/* Pending Claims */}
        <Link href="/dashboard/admin/claims" className="block">
          <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-800 hover:border-[#caf403] transition-all h-full flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-white">Pending Claims</h3>
                {counts.pendingClaims > 0 && (
                  <Badge className="bg-red-600 text-white text-lg px-4 py-1">
                    {counts.pendingClaims}
                  </Badge>
                )}
              </div>
              <p className="text-gray-400">
                Verify user-submitted proofs and approve/reject diamond earnings.
              </p>
            </div>
            <Button className="mt-6 bg-[#caf403] hover:bg-[#b0e000] text-black">
              Review Claims
            </Button>
          </div>
        </Link>

        {/* Pending Purchases */}
        <Link href="/dashboard/admin/purchases" className="block">
          <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-800 hover:border-[#caf403] transition-all h-full flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-white">Pending Purchases</h3>
                {counts.pendingPurchases > 0 && (
                  <Badge className="bg-red-600 text-white text-lg px-4 py-1">
                    {counts.pendingPurchases}
                  </Badge>
                )}
              </div>
              <p className="text-gray-400">
                Verify USDT transactions and approve diamond credits.
              </p>
            </div>
            <Button className="mt-6 bg-[#caf403] hover:bg-[#b0e000] text-black">
              Review Purchases
            </Button>
          </div>
        </Link>

        {/* Pending Withdrawals */}
        <Link href="/dashboard/admin/withdrawals" className="block">
          <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-800 hover:border-[#caf403] transition-all h-full flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-white">Pending Withdrawals</h3>
                {counts.pendingWithdrawals > 0 && (
                  <Badge className="bg-red-600 text-white text-lg px-4 py-1">
                    {counts.pendingWithdrawals}
                  </Badge>
                )}
              </div>
              <p className="text-gray-400">
                Review USDT payout requests and approve/reject.
              </p>
            </div>
            <Button className="mt-6 bg-[#caf403] hover:bg-[#b0e000] text-black">
              Review Withdrawals
            </Button>
          </div>
        </Link>
      </div>
    </div>
  );
}