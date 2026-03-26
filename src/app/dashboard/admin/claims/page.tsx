"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminClaimsPage() {
  const { user } = useUser();
  const supabase = useSupabase();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  // Fetch pending claims
  useEffect(() => {
    async function fetchPendingClaims() {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("claims")
          .select(`
            *,
            campaigns!inner (
              id,
              title,
              description,
              thumbnail_url
            )
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setClaims(data || []);
      } catch (err: any) {
        console.error("Fetch pending claims error:", err);
        setError(err.message || "Failed to load pending claims");
      } finally {
        setLoading(false);
      }
    }

    fetchPendingClaims();
  }, []);

  const handleAction = async (claimId: string, newStatus: "approved" | "rejected") => {
    console.log("=== DEBUG 1: handleAction called ===", { claimId, newStatus });

    setProcessing(claimId);

    try {
      console.log("=== DEBUG 2: Updating claim status to", newStatus);

      const { error: statusError } = await supabase
        .from("claims")
        .update({ status: newStatus })
        .eq("id", claimId);

      if (statusError) throw statusError;

      console.log("=== DEBUG 3: Status updated successfully");

      if (newStatus === "approved") {
        console.log("=== DEBUG 4: ENTERED approved block ===");

        const { data: claimData, error: fetchError } = await supabase
          .from("claims")
          .select("reward, user_id")
          .eq("id", claimId)
          .single();

        if (fetchError || !claimData) throw fetchError || new Error("No claim data");

        const rewardAmount = claimData.reward;
        const userId = claimData.user_id;

        console.log("=== DEBUG 6: Calling increment_balance ===", { userId, rewardAmount });

        const { error: creditError } = await supabase.rpc("increment_balance", {
          user_id_param: userId,
          amount: rewardAmount,
        });

        console.log("=== RPC FULL RESPONSE ===", { creditError });

        if (creditError) throw creditError;

        console.log("=== DEBUG 7: Credit SUCCESS ===");

        // ← BEAUTIFUL POLISH TOAST
        toast.success("Claim Approved & Diamonds Credited!", {
          description: `User received ${rewardAmount} diamonds. Balance updated live.`,
          duration: 5000,
        });
      } else {
        toast.error("Claim Rejected", {
          description: "The claim has been rejected successfully.",
        });
      }

      // Refresh list instantly
      setClaims((prev) =>
        prev.map((claim) =>
          claim.id === claimId ? { ...claim, status: newStatus } : claim
        )
      );
    } catch (err: any) {
      console.error("=== DEBUG ERROR: Full action failed ===", err);
      toast.error("Something went wrong", {
        description: err.message || "Failed to process claim",
      });
    } finally {
      setProcessing(null);
    }
  };

  // ... rest of your UI stays exactly the same (loading, error, cards, etc.)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#caf403]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p className="text-xl mb-4">Error loading pending claims</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin – Pending Claims</h1>
        <p className="text-gray-400">
          Review and approve/reject user-submitted proofs.
        </p>
      </div>

      {claims.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <p className="text-xl text-gray-400 mb-4">
            No pending claims to review.
          </p>
          <p className="text-gray-500">
            New claims will appear here when users submit proof.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {claims.map((claim) => (
            <Card
              key={claim.id}
              className="bg-[#1a1a1a] border border-gray-800 overflow-hidden"
            >
              {/* Your existing beautiful card UI stays 100% the same */}
              <div className="flex flex-col md:flex-row">
                {claim.campaigns?.thumbnail_url && (
                  <div className="md:w-48 h-48 md:h-auto overflow-hidden flex-shrink-0">
                    <img
                      src={claim.campaigns.thumbnail_url}
                      alt={claim.campaigns.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 p-6">
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl line-clamp-2 text-white">
                        {claim.campaigns?.title || "Unknown Campaign"}
                      </CardTitle>
                      <Badge
                        variant={
                          claim.status === "approved"
                            ? "default"
                            : claim.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          claim.status === "approved"
                            ? "bg-green-600"
                            : claim.status === "rejected"
                            ? "bg-red-600"
                            : "bg-yellow-600"
                        }
                      >
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-gray-400 mt-1">
                      Task: <span className="capitalize">{claim.task_type}</span> • Reward: {claim.reward} diamonds •{" "}
                      {new Date(claim.created_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-0 space-y-4">
                    {/* Your existing content (Twitter handle, screenshot, etc.) */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Submitted by:</span>
                      <a
                        href={`https://x.com/${claim.twitter_handle?.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#caf403] hover:underline flex items-center gap-1"
                      >
                        {claim.twitter_handle || "N/A"}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    {claim.screenshot_url && (
                      <div>
                        <p className="text-sm text-gray-300 mb-2">Proof screenshot:</p>
                        <div className="relative rounded-lg overflow-hidden border border-gray-700">
                          <img
                            src={claim.screenshot_url}
                            alt="Proof screenshot"
                            className="w-full h-48 object-cover"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white"
                            onClick={() => window.open(claim.screenshot_url, "_blank")}
                          >
                            View Full
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {claim.status === "pending" && (
                    <CardFooter className="pt-6 flex justify-end gap-4">
                      <Button
                        variant="destructive"
                        onClick={() => handleAction(claim.id, "rejected")}
                        disabled={processing === claim.id}
                        className="min-w-[120px]"
                      >
                        {processing === claim.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </Button>

                      <Button
                        onClick={() => handleAction(claim.id, "approved")}
                        disabled={processing === claim.id}
                        className="bg-green-600 hover:bg-green-700 min-w-[120px]"
                      >
                        {processing === claim.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve
                      </Button>
                    </CardFooter>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}