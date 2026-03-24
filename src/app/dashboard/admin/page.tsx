"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    pendingCampaigns: 0,
    pendingClaims: 0,
    pendingPurchases: 0,
    pendingWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial counts
    const fetchCounts = async () => {
      setLoading(true);

      const queries = [
        supabase.from("campaigns").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("claims").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("diamond_purchases").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("withdrawals").select("id", { count: "exact" }).eq("status", "pending"),
      ];

      const results = await Promise.all(queries.map(q => q));

      setCounts({
        pendingCampaigns: results[0].count || 0,
        pendingClaims: results[1].count || 0,
        pendingPurchases: results[2].count || 0,
        pendingWithdrawals: results[3].count || 0,
      });

      setLoading(false);
    };

    fetchCounts();

    // Realtime subscriptions – update counts when anything changes in pending state
    const channels = [
      // Campaigns
      supabase
        .channel("admin-pending-campaigns")
        .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, (payload) => {
          if (payload.new?.status === "pending" || payload.old?.status === "pending") {
            fetchCounts();
          }
        })
        .subscribe(),

      // Claims
      supabase
        .channel("admin-pending-claims")
        .on("postgres_changes", { event: "*", schema: "public", table: "claims" }, (payload) => {
          if (payload.new?.status === "pending" || payload.old?.status === "pending") {
            fetchCounts();
          }
        })
        .subscribe(),

      // Purchases
      supabase
        .channel("admin-pending-purchases")
        .on("postgres_changes", { event: "*", schema: "public", table: "diamond_purchases" }, (payload) => {
          if (payload.new?.status === "pending" || payload.old?.status === "pending") {
            fetchCounts();
          }
        })
        .subscribe(),

      // Withdrawals
      supabase
        .channel("admin-pending-withdrawals")
        .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, (payload) => {
          if (payload.new?.status === "pending" || payload.old?.status === "pending") {
            fetchCounts();
          }
        })
        .subscribe(),
    ];

    // Cleanup on unmount
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

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
                Approve, reject or mark campaigns as completed before they go live.
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