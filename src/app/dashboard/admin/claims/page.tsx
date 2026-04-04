"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AdminClaimsPage() {
  const { getToken } = useAuth();

  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const getSupabaseWithToken = async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("No authentication token");

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    );
  };

  // Fetch pending claims
  const fetchPendingClaims = async () => {
    try {
      setLoading(true);
      const supabaseWithToken = await getSupabaseWithToken();

      const { data, error } = await supabaseWithToken
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
      toast.error("Failed to load pending claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingClaims();
  }, []);

  const handleAction = async (claimId: string, newStatus: "approved" | "rejected") => {
    if (!confirm(`Are you sure you want to ${newStatus} this claim?`)) return;

    setProcessing(claimId);

    try {
      const supabaseWithToken = await getSupabaseWithToken();

      // Update claim status
      const { error: statusError } = await supabaseWithToken
        .from("claims")
        .update({ status: newStatus })
        .eq("id", claimId);

      if (statusError) throw statusError;

      if (newStatus === "approved") {
        // Get claim details to credit diamonds
        const { data: claimData } = await supabaseWithToken
          .from("claims")
          .select("reward, user_id")
          .eq("id", claimId)
          .single();

        if (claimData?.reward && claimData?.user_id) {
          const { error: creditError } = await supabaseWithToken.rpc("increment_balance", {
            user_id_param: claimData.user_id,
            amount: claimData.reward,
          });

          if (creditError) throw creditError;
        }

        toast.success("Claim Approved & Diamonds Credited!", {
          description: "User has received the diamonds.",
        });
      } else {
        toast.success("Claim Rejected");
      }

      // Remove from list instantly
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } catch (err: any) {
      console.error(err);
      toast.error("Action failed", { description: err.message || "Please try again" });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#caf403]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pending Claims</h1>
        <p className="text-gray-400">Review and approve user-submitted proofs</p>
      </div>

      {claims.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <p className="text-xl text-gray-400">No pending claims right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {claims.map((claim) => (
            <Card key={claim.id} className="bg-[#1a1a1a] border border-gray-800 overflow-hidden">
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
                      <CardTitle className="text-xl text-white">
                        {claim.campaigns?.title || "Unknown Campaign"}
                      </CardTitle>
                      <Badge className="bg-yellow-600">Pending</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Submitted by:</span>
                      <a
                        href={`https://x.com/${claim.twitter_handle?.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#caf403] hover:underline flex items-center gap-1"
                      >
                        {claim.twitter_handle}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    {claim.screenshot_url && (
                      <div>
                        <p className="text-sm text-gray-300 mb-2">Proof screenshot:</p>
                        <img
                          src={claim.screenshot_url}
                          alt="Proof"
                          className="w-full max-h-64 object-contain rounded-lg border border-gray-700"
                        />
                      </div>
                    )}

                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Reward:</span>
                      <span className="text-[#caf403] font-medium">{claim.reward} diamonds</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-6 flex justify-end gap-4">
                    <Button
                      variant="destructive"
                      onClick={() => handleAction(claim.id, "rejected")}
                      disabled={processing === claim.id}
                    >
                      {processing === claim.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject
                    </Button>

                    <Button
                      onClick={() => handleAction(claim.id, "approved")}
                      disabled={processing === claim.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing === claim.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve & Credit Diamonds
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}