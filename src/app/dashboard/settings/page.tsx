"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  const [twitterHandle, setTwitterHandle] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing bindings
  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    const loadBindings = async () => {
      const { data } = await supabase
        .from("users")
        .select("twitter_handle, wallet_address")
        .eq("id", user.id)
        .single();

      if (data) {
        setTwitterHandle(data.twitter_handle || "");
        setWalletAddress(data.wallet_address || "");
      }
      setLoading(false);
    };

    loadBindings();
  }, [isLoaded, user]);

  const saveBindings = async () => {
    if (!user?.id) return;

    setSaving(true);

    const { error } = await supabase
      .from("users")
      .upsert({
        id: user.id,
        twitter_handle: twitterHandle.trim() || null,
        wallet_address: walletAddress.trim() || null,
      }, { onConflict: "id" });

    if (error) {
      toast.error("Failed to save");
    } else {
      toast.success("Settings saved successfully");
    }
    setSaving(false);
  };

  if (!isLoaded || loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-[#caf403]" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Account Settings</h1>

      <Card className="bg-[#1a1a1a] border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Twitter / X Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="text-white">Twitter Handle (only one allowed)</Label>
          <Input
            placeholder="@yourusername"
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            className="bg-[#0d0d0d] text-white"
          />
          <p className="text-sm text-gray-400">
            This will be the only Twitter account used for all your task engagements.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">EVM Wallet Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="text-white">Wallet Address (for USDT payouts)</Label>
          <Input
            placeholder="0x1234...abcd"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="bg-[#0d0d0d] text-white"
          />
          <p className="text-sm text-gray-400">
            This is where you'll receive USDT when withdrawals are approved.
          </p>
        </CardContent>
      </Card>

      <Button
        onClick={saveBindings}
        disabled={saving}
        className="w-full bg-[#caf403] text-black py-6 text-lg font-bold"
      >
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}