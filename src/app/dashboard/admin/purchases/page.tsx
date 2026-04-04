"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AdminPurchasesPage() {
  const { getToken } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const getSupabaseWithToken = async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("No auth token");

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
  };

  const fetchPurchases = async () => {
    try {
      const supabaseWithToken = await getSupabaseWithToken();

      const { data, error } = await supabaseWithToken
        .from("diamond_purchases")
        .select(`
          *,
          users!inner (
            email,
            twitter_handle
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPurchases(data || []);
    } catch (err: any) {
      console.error("Error fetching purchases:", err);
      toast.error("Failed to load purchase requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // ====================== HANDLE APPROVE ======================
  const handleApprove = async (purchaseId: string, diamonds: number, userId: string) => {
    if (!confirm(`Approve ${diamonds} diamonds for this user?`)) return;

    setProcessing(purchaseId);

    try {
      const supabaseWithToken = await getSupabaseWithToken();

      // Credit diamonds to user
      const { error: creditError } = await supabaseWithToken.rpc("increment_balance", {
        user_id_param: userId,
        amount: diamonds,
      });
      if (creditError) throw creditError;

      // Mark purchase as approved
      const { error: updateError } = await supabaseWithToken
        .from("diamond_purchases")
        .update({ 
          status: "approved", 
          approved_at: new Date().toISOString() 
        })
        .eq("id", purchaseId);

      if (updateError) throw updateError;

      toast.success("Purchase Approved & Diamonds Credited");
      setPurchases(prev => prev.filter(p => p.id !== purchaseId));
    } catch (err: any) {
      toast.error("Failed to approve", { description: err.message });
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  // ====================== HANDLE REJECT ======================
  const handleReject = async (purchaseId: string) => {
    if (!confirm("Reject this purchase request?")) return;

    setProcessing(purchaseId);

    try {
      const supabaseWithToken = await getSupabaseWithToken();

      const { error } = await supabaseWithToken
        .from("diamond_purchases")
        .update({ 
          status: "rejected", 
          approved_at: new Date().toISOString() 
        })
        .eq("id", purchaseId);

      if (error) throw error;

      toast.success("Purchase Rejected");
      setPurchases(prev => prev.filter(p => p.id !== purchaseId));
    } catch (err: any) {
      toast.error("Failed to reject");
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[#caf403]" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Pending Diamond Purchases</h1>
      <p className="text-gray-400 mb-8">Review and approve/reject purchase requests</p>

      {purchases.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No pending purchase requests at the moment.
        </div>
      ) : (
        <div className="space-y-6">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white">
                    {purchase.diamonds_requested} Diamonds Requested
                  </CardTitle>
                  <Badge>Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-white">
                <p><strong>User:</strong> {purchase.users?.email || "Unknown"}</p>
                <p><strong>USDT Amount:</strong> {purchase.usdt_amount} USDT</p>
                <p>
                  <strong>Tx Hash:</strong>{" "}
                  <a
                    href={`https://testnet.bscscan.com/tx/${purchase.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#caf403] hover:underline flex items-center gap-1"
                  >
                    {purchase.tx_hash?.slice(0, 12)}...
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-4">
                <Button
                  variant="destructive"
                  onClick={() => handleReject(purchase.id)}
                  disabled={processing === purchase.id}
                >
                  {processing === purchase.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Reject
                </Button>

                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(purchase.id, purchase.diamonds_requested, purchase.user_id)}
                  disabled={processing === purchase.id}
                >
                  {processing === purchase.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Approve & Credit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}