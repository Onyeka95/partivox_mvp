"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    const { data, error } = await supabase
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

    if (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to load purchase requests");
    } else {
      setPurchases(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (purchaseId: string, diamonds: number, userId: string) => {
    if (!confirm(`Approve this purchase? ${diamonds} diamonds will be added to the user.`)) return;

    setProcessing(purchaseId);

    try {
      // 1. Add diamonds to user's balance
      const { error: creditError } = await supabase.rpc("increment_balance", {
        user_id_param: userId,
        amount: diamonds,
      });

      if (creditError) throw creditError;

      // 2. Mark purchase as approved
      const { error: updateError } = await supabase
        .from("diamond_purchases")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          // approved_by: current admin user_id if you track it later
        })
        .eq("id", purchaseId);

      if (updateError) throw updateError;

      toast.success("Purchase Approved", {
        description: `${diamonds} diamonds added to user. Tx verified.`,
      });

      // Refresh list (remove approved one)
      setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
    } catch (err: any) {
      toast.error("Failed to approve", { description: err.message });
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (purchaseId: string) => {
    if (!confirm("Reject this purchase request?")) return;

    setProcessing(purchaseId);

    try {
      const { error } = await supabase
        .from("diamond_purchases")
        .update({
          status: "rejected",
          approved_at: new Date().toISOString(),
        })
        .eq("id", purchaseId);

      if (error) throw error;

      toast.success("Purchase Rejected");
      setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
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
      <p className="text-gray-400 mb-8">
        Review and approve/reject creator diamond purchase requests.
      </p>

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
                    {purchase.diamonds_requested} diamonds requested
                  </CardTitle>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-white">
                <p><strong>User:</strong> {purchase.users?.email || "Unknown"}</p>
                <p><strong>Twitter:</strong> {purchase.users?.twitter_handle || "Not bound"}</p>
                <p><strong>USDT Amount:</strong> {purchase.usdt_amount.toFixed(6)} USDT</p>
                <p>
                  <strong>Transaction Hash:</strong>{" "}
                  <a
                    href={`https://testnet.bscscan.com/tx/${purchase.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#caf403] hover:underline flex items-center gap-1 inline-flex"
                  >
                    {purchase.tx_hash}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </p>
                <p className="text-sm text-gray-500">
                  Requested: {new Date(purchase.created_at).toLocaleString()}
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
                  Approve & Credit Diamonds
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}