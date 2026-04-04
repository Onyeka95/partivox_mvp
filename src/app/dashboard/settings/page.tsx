"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [twitterHandle, setTwitterHandle] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing data
  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    const loadSettings = async () => {
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
          .select("twitter_handle, wallet_address")
          .eq("id", user.id)
          .single();

        if (data) {
          setTwitterHandle(data.twitter_handle || "");
          setWalletAddress(data.wallet_address || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [isLoaded, user, getToken]);

  const saveSettings = async () => {
    if (!user?.id) return toast.error("Please sign in");

    setSaving(true);

    try {
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Authentication failed");

      const supabaseWithToken = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { error } = await supabaseWithToken
        .from("users")
        .upsert({
          id: user.id,
          twitter_handle: twitterHandle.trim() || null,
          wallet_address: walletAddress.trim() || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Settings Saved Successfully", {
        description: "Your Twitter handle and wallet address have been updated.",
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save settings", {
        description: err.message || "Please try again",
      });
    } finally {
      setSaving(false);
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
      <h1 className="text-4xl font-bold mb-8">Account Settings</h1>

      <Card className="bg-[#1a1a1a] border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Twitter / X Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="text-white">Twitter Handle</Label>
          <Input
            placeholder="@yourusername"
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            className="bg-[#0d0d0d] text-white"
          />
          <p className="text-sm text-gray-400">
            This will be used for all your task engagements.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Withdrawal Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="text-white">EVM Wallet Address (BSC)</Label>
          <Input
            placeholder="0x1234...abcd"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="bg-[#0d0d0d] text-white"
          />
          <p className="text-sm text-gray-400">
            This is where you will receive USDT from approved withdrawals.
          </p>
        </CardContent>
      </Card>

      <Button
        onClick={saveSettings}
        disabled={saving}
        className="w-full bg-[#caf403] text-black py-6 text-lg font-bold hover:bg-[#b0e000] disabled:opacity-50"
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving...
          </span>
        ) : (
          "Save Settings"
        )}
      </Button>
    </div>
  );
}