"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ────────────────────────────────────────────────
// CONFIG – change these values when switching networks
// ────────────────────────────────────────────────
const IS_TESTNET = true; // ← change to false when ready for mainnet
const TREASURY_WALLET = IS_TESTNET
  ? "0x6cbfE25E3d26dec6c2eFB6eede9b5687b3a31e9f" // ← REPLACE with your BSC Testnet wallet
  : "0x9D3A2eF16f6592F6C29fdCF1e3DC9f75a9D1b45D";

const DIAMOND_TO_USDT_RATE = 0.001; // 1 diamond = 0.001 USDT
const PLATFORM_FEE_PERCENT = 20;     // 20% fee on purchase

export default function BuyDiamondsPage() {
  const { user, isLoaded } = useUser();
  const supabase = useSupabase();
  const [diamondsWanted, setDiamondsWanted] = useState("");
  const [txHash, setTxHash] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);       // ← NEW: screenshot/proof
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);

  // Load current balance (just for display/reference)
  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    const loadBalance = async () => {
      const { data } = await supabase
        .from("users")
        .select("diamonds_balance")
        .eq("id", user.id)
        .single();

      if (data) setUserBalance(data.diamonds_balance || 0);
    };

    loadBalance();
  }, [isLoaded, user, supabase]);

  const totalUSDT = Number(diamondsWanted) * DIAMOND_TO_USDT_RATE;
  const feeUSDT = totalUSDT * (PLATFORM_FEE_PERCENT / 100);
  const youPayUSDT = totalUSDT + feeUSDT;

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }

    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitPurchase = async () => {
    if (!user?.id) return toast.error("Please sign in");

    const diamonds = Number(diamondsWanted);
    if (!diamonds || diamonds <= 0) return toast.error("Enter a valid amount");
    if (!txHash.trim()) return toast.error("Please paste the transaction hash");

    // On mainnet, require proof screenshot
    if (!IS_TESTNET && !proofFile) {
      return toast.error("Please upload proof of payment (screenshot from platform)");
    }

    setSubmitting(true);

    try {
      let proofUrl = null;

      // Upload proof screenshot (only if provided – on mainnet it's required)
      if (proofFile) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${proofFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from("diamond_purchases")
          .upload(`proofs/${fileName}`, proofFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("diamond_purchases").getPublicUrl(`proofs/${fileName}`);
        proofUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("diamond_purchases").insert({
        user_id: user.id,
        diamonds_requested: diamonds,
        usdt_amount: youPayUSDT,
        tx_hash: txHash.trim(),
        proof_url: proofUrl,           // ← saved when uploaded
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Purchase Request Sent", {
        description: `Requested ${diamonds} diamonds (~${youPayUSDT.toFixed(6)} USDT). Admin will review your transaction and proof shortly.`,
      });

      setDiamondsWanted("");
      setTxHash("");
      setProofFile(null);
      setProofPreview(null);
    } catch (err: any) {
      toast.error("Failed to submit request", { description: err.message });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-[#caf403]" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-2">Buy Diamonds</h1>
      <p className="text-gray-400 mb-8">
        Top up your balance to create more campaigns and reward engagers.
      </p>

      {IS_TESTNET && (
        <div className="mb-8 p-5 bg-yellow-950 border border-yellow-600 rounded-xl text-yellow-300 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-lg">Testnet Mode Active</strong><br />
              This is a test environment using BSC Testnet USDT (free). Real purchases are not active yet.
            </div>
          </div>

          <Button
            variant="outline"
            className="border-yellow-500 text-black hover:bg-yellow-950 hover:text-yellow-200 self-start"
            asChild
          >
            <a href="https://www.bnbchain.org/en/testnet-faucet" target="_blank" rel="noopener noreferrer">
              Get Free Testnet USDT (BNB Chain Faucet)
            </a>
          </Button>
        </div>
      )}

      {!IS_TESTNET && (
        <div className="mb-8 p-5 bg-green-950 border border-green-700 rounded-xl text-green-300">
          <strong>Mainnet Purchases Active</strong><br />
          Send USDT (BEP-20) on BSC to the treasury wallet below and upload proof.
        </div>
      )}

      <Card className="bg-[#1a1a1a] border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Purchase Details</CardTitle>
          <CardDescription>
            Current rate: 1 diamond = {DIAMOND_TO_USDT_RATE} USDT • 20% platform fee
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-white">How many diamonds do you want?</Label>
            <Input
              type="number"
              placeholder="e.g. 5000"
              value={diamondsWanted}
              onChange={(e) => setDiamondsWanted(e.target.value)}
              className="bg-[#0d0d0d] text-lg py-6 text-white"
            />
          </div>

          {diamondsWanted && Number(diamondsWanted) > 0 && (
            <div className="p-5 bg-[#0d0d0d] rounded-xl space-y-3 text-sm">
              <p>
                Diamonds: <strong>{diamondsWanted}</strong>
              </p>
              <p>
                Gross cost: <strong>{totalUSDT.toFixed(6)} USDT</strong>
              </p>
              <p className="text-yellow-400">
                Platform fee (20%): <strong>{feeUSDT.toFixed(6)} USDT</strong>
              </p>
              <p className="text-lg font-medium text-[#caf403]">
                You pay: {youPayUSDT.toFixed(6)} USDT
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-white">Send USDT to this wallet (BSC {IS_TESTNET ? "Testnet" : "Mainnet"})</Label>
            <div className="flex items-center gap-3">
              <Input
                value={TREASURY_WALLET}
                readOnly
                className="bg-[#0d0d0d] font-mono text-sm flex-1 text-white"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(TREASURY_WALLET);
                  toast.success("Wallet address copied!");
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Network: BSC {IS_TESTNET ? "Testnet (Chain ID 97)" : "Mainnet (Chain ID 56)"}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Transaction Hash (TxID)</Label>
            <Input
              placeholder="0x..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="bg-[#0d0d0d] text-white"
            />
            <p className="text-xs text-gray-400">
              Paste the transaction hash after sending USDT.
            </p>
          </div>

          {/* Screenshot/Proof Upload – visible on both testnet & mainnet, but required only on mainnet */}
          <div className="space-y-2">
            <Label className="text-white">
              Proof of Payment {IS_TESTNET ? "(optional for testnet)" : "(required)"}
            </Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleProofChange}
              className="bg-[#0d0d0d] text-white"
            />
            <p className="text-xs text-gray-400">
              Upload screenshot/receipt showing you sent USDT to this treasury wallet.
            </p>
            {proofPreview && (
              <div className="mt-2">
                <img
                  src={proofPreview}
                  alt="Proof preview"
                  className="max-h-48 rounded border border-gray-700"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmitPurchase}
            disabled={submitting || !diamondsWanted || !txHash.trim() || (!IS_TESTNET && !proofFile)}
            className="w-full bg-[#caf403] text-black py-6 text-lg font-bold hover:bg-[#b0e000] disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </span>
            ) : (
              "I Have Sent the USDT – Submit Request"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}