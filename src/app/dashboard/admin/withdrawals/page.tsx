"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

// Fixed constants (change here if needed later)
const DIAMOND_TO_USDT_RATE = 0.001;   // 1 diamond = 0.001 USDT
const FEE_PERCENT = 5;                // 5% platform fee

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    const { data, error } = await supabase
      .from("withdrawals")
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
      toast.error("Failed to load requests");
      console.error(error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (requestId: string, diamonds: number, userId: string) => {
    if (!confirm("Approve this withdrawal? Diamonds will be deducted.")) return;

    setProcessing(requestId);

    try {
      // 1. Deduct diamonds from user
      const { error: deductError } = await supabase.rpc("decrement_balance", {
        user_id_param: userId,
        amount_param: diamonds,
      });

      if (deductError) throw deductError;

      // 2. Update request to approved
      const { error: updateError } = await supabase
        .from("withdrawals")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Calculate net USDT for toast (for admin reference)
      const grossUSDT = diamonds * DIAMOND_TO_USDT_RATE;
      const feeUSDT = grossUSDT * (FEE_PERCENT / 100);
      const netUSDT = grossUSDT - feeUSDT;

      toast.success("Withdrawal Approved", {
        description: `${diamonds} diamonds deducted. Send ≈ ${netUSDT.toFixed(6)} USDT manually.`,
      });

      // Refresh list
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err: any) {
      toast.error("Failed to approve");
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm("Reject this withdrawal?")) return;

    setProcessing(requestId);

    const { error } = await supabase
      .from("withdrawals")
      .update({ status: "rejected" })
      .eq("id", requestId);

    if (error) {
      toast.error("Failed to reject");
    } else {
      toast.success("Withdrawal Rejected");
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    }
    setProcessing(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-[#caf403]" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Pending Withdrawals</h1>
      <p className="text-gray-400 mb-8">
        Review and approve/reject user withdrawal requests. Net USDT shown after 5% fee.
      </p>

      {requests.length === 0 ? (
        <p className="text-center text-gray-500 py-20">No pending withdrawal requests.</p>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => {
            const grossUSDT = req.amount * DIAMOND_TO_USDT_RATE;
            const feeUSDT = grossUSDT * (FEE_PERCENT / 100);
            const netUSDT = grossUSDT - feeUSDT;

            return (
              <Card key={req.id} className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle className="text-white">
                      {req.amount} diamonds → USDT
                    </CardTitle>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-white">
                  <p><strong>User:</strong> {req.users?.email || "Unknown"}</p>
                  <p><strong>Twitter:</strong> {req.users?.twitter_handle || "Not bound"}</p>
                  <p><strong>Wallet:</strong> <code className="bg-gray-900 p-1 rounded">{req.wallet_address}</code></p>

                  {/* Fee calculation box */}
                  <div className="p-4 bg-[#0f0f0f] rounded-lg border border-gray-700 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gross value:</span>
                      <span>{grossUSDT.toFixed(6)} USDT</span>
                    </div>
                    <div className="flex justify-between text-yellow-400">
                      <span>Platform fee (5%):</span>
                      <span>{feeUSDT.toFixed(6)} USDT</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                      <span className="text-white">Admin should send:</span>
                      <span className="text-[#caf403]">{netUSDT.toFixed(6)} USDT</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">
                    Requested: {new Date(req.created_at).toLocaleString()}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(req.id)}
                    disabled={processing === req.id}
                  >
                    {processing === req.id ? <Loader2 className="animate-spin mr-2" /> : <XCircle className="mr-2" />}
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(req.id, req.amount, req.user_id)}
                    disabled={processing === req.id}
                  >
                    {processing === req.id ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                    Approve (Manual Send)
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}