"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";

interface ClaimTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  taskType: string; // e.g. "like", "retweet"
  reward: number;
  onClaimSuccess: () => void;
}

export function ClaimTaskModal({
  open,
  onOpenChange,
  campaignId,
  taskType,
  reward,
  onClaimSuccess,
}: ClaimTaskModalProps) {
  const { user } = useUser();
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB)");
      return;
    }

    setScreenshot(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("Please log in to claim rewards");
      return;
    }
    if (!screenshot) {
      setError("Please upload a screenshot as proof");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload screenshot
      const fileExt = screenshot.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `claims/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("claims") // new bucket for claims/screenshots
        .upload(filePath, screenshot);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("claims").getPublicUrl(filePath);
      const screenshotUrl = urlData.publicUrl;

      // 2. Insert claim record
      const { error: insertError } = await supabase.from("claims").insert({
        campaign_id: campaignId,
        user_id: user.id,
        task_type: taskType,
        reward,
        screenshot_url: screenshotUrl,
        status: "pending", // admin approves later
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      onClaimSuccess();
      onOpenChange(false);
      alert("Claim submitted! Await approval.");
    } catch (err) {
      console.error("Claim error:", err);
      setError("Failed to submit claim. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] text-white border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle>Claim Reward: {taskType}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload screenshot proof to earn {reward} diamonds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Screenshot upload */}
          <div className="space-y-2">
            <Label htmlFor="screenshot">Screenshot Proof</Label>
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Screenshot preview"
                  className="w-full h-64 object-contain rounded border border-gray-700"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setScreenshot(null);
                    setPreview(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                <Label
                  htmlFor="screenshot"
                  className="cursor-pointer text-gray-400 hover:text-white"
                >
                  Click to upload screenshot
                </Label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-2">JPG/PNG, max 5MB</p>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !screenshot}
            className="bg-[#caf403] hover:bg-[#a0d900] text-black"
          >
            {isSubmitting ? "Submitting..." : "Submit Claim"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}