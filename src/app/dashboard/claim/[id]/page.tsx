"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase-client";
import { useUser } from "@clerk/nextjs";
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
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ClaimCampaignPage() {
  const { id: campaignId } = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = useSupabase();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean | null>(null); // null = loading
  const [loading, setLoading] = useState(true);
  const [twitterHandle, setTwitterHandle] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch campaign + check if user already claimed
  useEffect(() => {
    async function loadData() {
      if (!isLoaded || !user?.id || !campaignId) return;

      setLoading(true);

      try {
        // 1. Fetch campaign details
        const { data: campData, error: campError } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", campaignId)
          .single();

        if (campError) throw campError;
        setCampaign(campData);

        // 2. Check if user already has a claim for this campaign
        const { data: existingClaim, error: claimError } = await supabase
          .from("claims")
          .select("id")
          .eq("user_id", user.id)
          .eq("campaign_id", campaignId)
          .maybeSingle();

        if (claimError) throw claimError;
        setHasClaimed(!!existingClaim);
      } catch (err: any) {
        console.error("Load error:", err);
        setSubmitError("Failed to load campaign or check status");
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [campaignId, user, isLoaded]);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("File too large (max 5MB)");
      return;
    }

    setScreenshot(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitClaim = async () => {
    if (!user?.id) return setSubmitError("Please log in");
    if (!twitterHandle.trim()) return setSubmitError("Twitter handle required");
    if (!screenshot) return setSubmitError("Screenshot required");

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Double-check no claim exists (extra safety)
      const { data: existing } = await supabase
        .from("claims")
        .select("id")
        .eq("user_id", user.id)
        .eq("campaign_id", campaignId)
        .maybeSingle();

      if (existing) {
        setHasClaimed(true);
        throw new Error("You already submitted a claim for this campaign");
      }

      // Upload screenshot
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${screenshot.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("claims")
        .upload(`screenshots/${fileName}`, screenshot);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("claims").getPublicUrl(`screenshots/${fileName}`);
      const screenshotUrl = urlData.publicUrl;

      // Calculate total reward
      const totalReward = campaign.tasks.reduce((sum: number, task: any) => sum + (task.reward || 0), 0);

      // Insert claim
      const { error: insertError } = await supabase.from("claims").insert({
        campaign_id: campaignId,
        user_id: user.id,
        twitter_handle: twitterHandle.trim(),
        screenshot_url: screenshotUrl,
        status: "pending",
        reward: totalReward,
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      toast.success("Proof Submitted", {
        description: `Awaiting admin approval for ${totalReward} diamonds.`,
      });

      setHasClaimed(true);
      router.push("/dashboard/my-claims");
    } catch (err: any) {
      console.error("Claim error:", err);
      if (err.message.includes("already submitted")) {
        setHasClaimed(true);
        toast.error("Already Claimed", { description: "You have already submitted a claim for this campaign." });
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
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#caf403]" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#111111] text-white p-8 flex items-center justify-center">
        <p className="text-red-400 text-xl">Campaign not found</p>
      </div>
    );
  }

  if (hasClaimed) {
    return (
      <div className="min-h-screen bg-[#111111] text-white p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Already Claimed</h2>
          <p className="text-xl text-gray-300 mb-8">
            You have already submitted a claim for this campaign. Wait for admin review.
          </p>
          <Button asChild size="lg" className="bg-[#caf403] hover:bg-[#b0e000] text-black">
            <Link href="/dashboard/my-claims">View My Claims</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {campaign.thumbnail_url && (
          <div className="mb-10 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={campaign.thumbnail_url}
              alt={campaign.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-white">
          {campaign.title}
        </h1>

        <p className="text-xl md:text-2xl text-gray-200 mb-12 leading-relaxed">
          {campaign.description}
        </p>

        {/* Reward Breakdown */}
        <Card className="bg-[#1e1e1e] border-[#2a2a2a] mb-12 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-[#caf403]">Your Potential Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {campaign.tasks.map((task: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-[#0f0f0f] p-5 rounded-xl text-center border border-gray-800 hover:border-[#caf403]/50 transition-all"
                >
                  <p className="text-2xl font-bold text-[#caf403] mb-2">{task.reward}</p>
                  <p className="text-gray-300 capitalize">{task.type}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center text-lg font-medium text-gray-200">
              Total possible reward:{" "}
              <span className="text-[#caf403] text-2xl font-bold">
                {campaign.tasks.reduce((sum: number, t: any) => sum + (t.reward || 0), 0)}
              </span>{" "}
              diamonds
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mb-12 p-8 bg-[#1e1e1e] rounded-2xl border border-gray-700 shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 text-[#caf403]">
            How to Complete This Campaign
          </h3>
          <ol className="list-decimal pl-8 space-y-4 text-lg text-gray-200">
            <li>Click each link below to open the correct post or profile on X/Twitter.</li>
            <li>Perform the requested action (follow, like, retweet, comment, quote, etc.).</li>
            <li>Return to this page after completing all tasks.</li>
            <li>Enter your Twitter handle and upload one combined screenshot showing all actions.</li>
            <li>Click "Submit Proof & Claim Reward" — your claim will be reviewed by an admin.</li>
            <li>Once approved, your diamonds will be credited to your account.</li>
          </ol>
        </div>

        {/* Links */}
        <Card className="bg-[#1e1e1e] border-gray-700 mb-12 shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Engagement Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {campaign.links?.length > 0 ? (
              campaign.links.map((link: string, i: number) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 bg-[#0f0f0f] rounded-xl hover:bg-[#252525] transition-all duration-300 text-[#caf403] text-lg font-medium shadow-md hover:shadow-lg break-all"
                >
                  {link}
                </a>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8 text-lg">
                No specific links provided — engage based on description.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Proof Submission */}
        <Card className="bg-[#1e1e1e] border-gray-700 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Submit Your Proof</CardTitle>
          </CardHeader>
          <CardContent className="space-y-10 pt-8">
            {/* Twitter Handle */}
            <div className="space-y-4">
              <Label htmlFor="twitterHandle" className="text-xl font-medium text-gray-100">
                Your Twitter / X Handle
              </Label>
              <Input
                id="twitterHandle"
                placeholder="@yourusername"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                className="bg-[#0f0f0f] border-gray-700 text-white text-xl py-7 focus:ring-[#caf403] focus:border-[#caf403]"
              />
              <p className="text-sm text-gray-400">
                This must match the account you used to complete the tasks.
              </p>
            </div>

            {/* Screenshot */}
            <div className="space-y-4">
              <Label className="text-xl font-medium text-gray-100">
                Upload Screenshot Proof (combined)
              </Label>
              <p className="text-gray-300">
                Take one or two screenshots showing all completed actions (follows, likes, retweets, comments, etc.).
              </p>
              <div className="border-2 border-dashed border-gray-600 rounded-2xl p-12 text-center bg-[#0f0f0f]">
                {preview ? (
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="Screenshot preview"
                      className="max-h-[500px] mx-auto rounded-xl shadow-2xl"
                    />
                    <Button
                      variant="destructive"
                      size="lg"
                      className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        setScreenshot(null);
                        setPreview(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Label
                      htmlFor="screenshot"
                      className="cursor-pointer text-[#caf403] hover:text-[#d0ff4d] text-2xl block mb-4 font-semibold"
                    >
                      Click or drag to upload screenshot
                    </Label>
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshot}
                      className="hidden"
                    />
                    <p className="text-base text-gray-500">JPG / PNG — max 5MB</p>
                  </>
                )}
              </div>
            </div>

            {submitError && (
              <p className="text-red-400 text-center text-lg font-medium bg-red-950/30 py-4 rounded-xl">
                {submitError}
              </p>
            )}
          </CardContent>

          <CardFooter className="pt-10 pb-10 px-8">
            <Button
              onClick={handleSubmitClaim}
              disabled={isSubmitting || !twitterHandle.trim() || !screenshot}
              className="w-full bg-gradient-to-r from-[#caf403] to-[#b8e600] hover:from-[#d0ff4d] hover:to-[#c8ff00] text-black py-8 text-2xl font-bold disabled:opacity-50 shadow-2xl"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="h-7 w-7 animate-spin" />
                  Submitting Proof...
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