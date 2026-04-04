"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const DIAMOND_TO_USDT_RATE = 0.001;
const FEE_PERCENT = 5;
const MIN_WITHDRAWAL_DIAMONDS = 1000;

export default function WithdrawPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load balance and wallet with token
  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    const loadData = async () => {
      try {
        const token = await getToken({ template: "supabase" });
        if (!token) return;

        const supabaseWithToken = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { data } = await supabaseWithToken
          .from("users")
          .select("diamonds_balance, wallet_address")
          .eq("id", user.id)
          .single();

        if (data) {
          setBalance(data.diamonds_balance || 0);
          setWallet(data.wallet_address || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoaded, user, getToken]);

  const diamonds = Number(amount) || 0;
  const grossUSDT = diamonds * DIAMOND_TO_USDT_RATE;
  const feeUSDT = grossUSDT * (FEE_PERCENT / 100);
  const netUSDT = grossUSDT - feeUSDT;

  const canSubmit = !submitting && diamonds >= MIN_WITHDRAWAL_DIAMONDS && diamonds <= balance && !!wallet;

  const handleWithdraw = async () => {
    if (!user?.id) return toast.error("Please sign in");
    if (diamonds < MIN_WITHDRAWAL_DIAMONDS) return toast.error(`Minimum is ${MIN_WITHDRAWAL_DIAMONDS} diamonds`);
    if (diamonds > balance) return toast.error("Insufficient balance");
    if (!wallet) return toast.error("No wallet address bound");

    setSubmitting(true);

    try {
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Authentication failed");

      const supabaseWithToken = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { error } = await supabaseWithToken.from("withdrawals").insert({
        user_id: user.id,
        amount: diamonds,
        wallet_address: wallet,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Withdrawal Requested", {
        description: `${diamonds} diamonds → ≈ ${netUSDT.toFixed(6)} USDT after fee. Admin will review soon.`,
      });

      setAmount("");
    } catch (err: any) {
      toast.error("Failed to submit withdrawal", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[#caf403]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-2">Withdraw Diamonds</h1>
      <p className="text-gray-400 mb-8">
        1 diamond = {DIAMOND_TO_USDT_RATE} USDT • {FEE_PERCENT}% fee • Min {MIN_WITHDRAWAL_DIAMONDS} diamonds
      </p>

      <Card className="bg-[#1a1a1a] border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-[#caf403]">{balance}</div>
          <p className="text-gray-400 mt-2">diamonds available</p>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Request Withdrawal</CardTitle>
          <CardDescription>
            Enter amount. USDT will be sent after admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-white">Amount (diamonds)</Label>
            <Input
              type="number"
              placeholder={`Min ${MIN_WITHDRAWAL_DIAMONDS}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#0d0d0d] text-white"
            />
          </div>

          {diamonds > 0 && (
            <div className="p-5 bg-[#0f0f0f] rounded-lg border border-gray-700 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Gross value:</span>
                <span>{grossUSDT.toFixed(6)} USDT</span>
              </div>
              <div className="flex justify-between text-yellow-400">
                <span>Platform fee ({FEE_PERCENT}%):</span>
                <span>{feeUSDT.toFixed(6)} USDT</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                <span className="text-white">You will receive:</span>
                <span className="text-[#caf403]">{netUSDT.toFixed(6)} USDT</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-white">Receiving Wallet Address</Label>
            <div className="flex gap-3">
              <Input
                value={wallet}
                readOnly
                className="bg-[#0d0d0d] text-white flex-1"
              />
              <Button variant="outline" asChild>
                <Link href="/dashboard_user/settings">Change</Link>
              </Button>
            </div>
            {!wallet && (
              <p className="text-sm text-yellow-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                No wallet bound. Go to Settings.
              </p>
            )}
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={!canSubmit}
            className="w-full bg-[#caf403] text-black py-6 text-lg font-bold hover:bg-[#b0e000] disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </span>
            ) : (
              "Request Withdrawal"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}