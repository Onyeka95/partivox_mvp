"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ClaimCampaignPage() {
  const { id: campaignId } = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [campaign, setCampaign] = useState<any>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [twitterHandle, setTwitterHandle] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch campaign + check if already claimed
  useEffect(() => {
    async function loadData() {
      if (!isLoaded || !user?.id || !campaignId) return;

      setLoading(true);

      try {
        const token = await getToken({ template: "supabase" });
        if (!token) throw new Error("Authentication failed");

        const supabaseWithToken = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } }
          }
        );

        // Fetch campaign
        const { data: campData, error: campError } = await supabaseWithToken
          .from("campaigns")
          .select("*")
          .eq("id", campaignId)
          .single();

        if (campError) throw campError;
        setCampaign(campData);

        // Check if user already claimed
        const { data: existingClaim } = await supabaseWithToken
          .from("claims")
          .select("id")
          .eq("user_id", user.id)
          .eq("campaign_id", campaignId)
          .maybeSingle();

        setHasClaimed(!!existingClaim);
      } catch (err: any) {
        console.error("Load error:", err);
        toast.error("Failed to load campaign");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [campaignId, user, isLoaded, getToken]);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }

    setScreenshot(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitClaim = async () => {
    if (!user?.id) return toast.error("Please log in");
    if (!twitterHandle.trim()) return toast.error("Twitter handle is required");
    if (!screenshot) return toast.error("Please upload a screenshot");

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Authentication failed");

      const supabaseWithToken = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } }
        }
      );

      // Double-check no existing claim
      const { data: existing } = await supabaseWithToken
        .from("claims")
        .select("id")
        .eq("user_id", user.id)
        .eq("campaign_id", campaignId)
        .maybeSingle();

      if (existing) {
        setHasClaimed(true);
        throw new Error("You have already submitted a claim for this campaign");
      }

      // Upload screenshot
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${screenshot.name.split('.').pop()}`;
      const { error: uploadError } = await supabaseWithToken.storage
        .from("claims")
        .upload(`screenshots/${fileName}`, screenshot);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseWithToken.storage
        .from("claims")
        .getPublicUrl(`screenshots/${fileName}`);
      const screenshotUrl = urlData.publicUrl;

      // Calculate total reward
      const totalReward = campaign.tasks.reduce((sum: number, task: any) => sum + (task.reward || 0), 0);

      // Insert claim
      const { error: insertError } = await supabaseWithToken.from("claims").insert({
        campaign_id: campaignId,
        user_id: user.id,
        twitter_handle: twitterHandle.trim(),
        screenshot_url: screenshotUrl,
        status: "pending",
        reward: totalReward,
      });

      if (insertError) throw insertError;

      toast.success("Claim Submitted Successfully!", {
        description: `Your proof has been submitted. You will receive ${totalReward} diamonds once approved.`,
      });

      setHasClaimed(true);
      router.push("/dashboard_user/my-claims");

    } catch (err: any) {
      console.error("Claim error:", err);
      if (err.message.includes("already submitted")) {
        setHasClaimed(true);
        toast.error("Already Claimed");
      } else {
        setSubmitError(err.message || "Failed to submit claim");
        toast.error("Submission Failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#caf403]" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white p-8 flex items-center justify-center">
        <p className="text-red-400 text-xl">Campaign not found</p>
      </div>
    );
  }

  if (hasClaimed) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Already Claimed</h2>
          <p className="text-xl text-gray-300 mb-8">
            You have already submitted a claim for this campaign.
          </p>
          <Button asChild size="lg" className="bg-[#caf403] hover:bg-[#b0e000] text-black">
            <Link href="/dashboard_user/my-claims">View My Claims</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {campaign.thumbnail_url && (
          <div className="mb-10 rounded-2xl overflow-hidden">
            <img
              src={campaign.thumbnail_url}
              alt={campaign.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-bold mb-6">{campaign.title}</h1>
        <p className="text-xl text-gray-200 mb-12 leading-relaxed">{campaign.description}</p>

        {/* Reward Breakdown */}
        <Card className="bg-[#1a1a1a] border-gray-700 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-[#caf403]">Potential Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {campaign.tasks?.map((task: any, idx: number) => (
                <div key={idx} className="bg-[#111] p-6 rounded-xl text-center">
                  <p className="text-3xl font-bold text-[#caf403]">{task.reward}</p>
                  <p className="text-gray-300 capitalize mt-2">{task.type}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center text-xl font-medium text-white">
              Total possible reward:{" "}
              <span className="text-[#caf403] font-bold">
                {campaign.tasks?.reduce((sum: number, t: any) => sum + (t.reward || 0), 0)}
              </span>{" "}
              diamonds
            </div>
          </CardContent>
        </Card>

        {/* 🔥 Engagement Links Section (NEW) */}
        {campaign.links?.length > 0 && (
          <Card className="bg-[#1a1a1a] border-gray-700 text-white">
            <CardHeader>
              <CardTitle>Engagement Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaign.links.map((link: string, index: number) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-[#111] p-4 rounded-lg hover:bg-[#1f1f1f] transition"
                >
                  <span className="truncate">{link}</span>
                  <ExternalLink className="h-4 w-4 text-[#caf403]" />
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        

        {/* Submission Form */}
        <Card className="bg-[#1a1a1a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Submit Your Proof</CardTitle>
          </CardHeader>
          <CardContent className="space-y-10">
            <div className="space-y-4">
              <Label htmlFor="twitterHandle" className="text-lg text-white">Your Twitter / X Handle</Label>
              <Input
                id="twitterHandle"
                placeholder="@yourusername"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                className="bg-[#0f0f0f] border-gray-700 text-white py-6 text-lg"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-lg text-white">Upload Screenshot Proof</Label>
              <div className="border-2 border-dashed border-gray-600 rounded-2xl p-12 text-center bg-[#111]">
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="preview" className="max-h-[420px] mx-auto rounded-xl" />
                    <Button
                      variant="destructive"
                      className="absolute top-4 right-4"
                      onClick={() => { setScreenshot(null); setPreview(null); }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Label htmlFor="screenshot" className="cursor-pointer text-[#caf403] text-xl block">
                    Click to upload screenshot (max 5MB)
                  </Label>
                )}
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshot}
                  className="hidden"
                />
              </div>
            </div>

            {submitError && (
              <p className="text-red-400 text-center bg-red-950/30 py-4 rounded-xl">{submitError}</p>
            )}
          </CardContent>

          <CardFooter className="pt-8 pb-10">
            <Button
              onClick={handleSubmitClaim}
              disabled={isSubmitting || !twitterHandle.trim() || !screenshot}
              className="w-full bg-[#caf403] hover:bg-[#b0e000] text-black py-8 text-2xl font-bold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="h-7 w-7 animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Proof & Claim Reward"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}