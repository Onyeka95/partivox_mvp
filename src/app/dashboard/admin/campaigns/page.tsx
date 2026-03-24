"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, CheckSquare } from "lucide-react";
import { toast } from "sonner";

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          users!inner (
            email,
            twitter_handle
          )
        `)
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    campaignId: string,
    action: "approve" | "reject" | "complete",
    totalDiamonds?: number,
    userId?: string
  ) => {
    const actionText = {
      approve: "approve",
      reject: "reject (and refund diamonds)",
      complete: "mark as completed",
    }[action];

    if (!confirm(`Are you sure you want to ${actionText} this campaign?`)) return;

    setProcessing(campaignId);

    try {
      let updateData: any = {};

      if (action === "approve") {
        updateData = { status: "approved" };
      } else if (action === "reject") {
        updateData = { status: "rejected" };

        // Refund diamonds if rejected
        if (totalDiamonds && userId) {
          const { error: refundError } = await supabase.rpc("increment_balance", {
            user_id_param: userId,
            amount_param: totalDiamonds,
          });
          if (refundError) throw refundError;
          toast.info("Diamonds refunded to creator");
        }
      } else if (action === "complete") {
        updateData = { status: "completed" };
      }

      const { error } = await supabase
        .from("campaigns")
        .update(updateData)
        .eq("id", campaignId);

      if (error) throw error;

      toast.success(`Campaign ${action}d!`);

      // Remove from list
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-[#caf403]" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Review Campaigns</h1>
      <p className="text-gray-400 mb-8">
        Approve, reject (with refund), or mark campaigns as completed.
      </p>

      {campaigns.length === 0 ? (
        <p className="text-center text-gray-500 py-20">
          No pending or active campaigns to review.
        </p>
      ) : (
        <div className="space-y-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl text-white">{campaign.title}</CardTitle>
                  <Badge
                    variant={
                      campaign.status === "approved"
                        ? "default"
                        : campaign.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className={
                      campaign.status === "approved"
                        ? "bg-green-600"
                        : campaign.status === "rejected"
                        ? "bg-red-600"
                        : "bg-yellow-600"
                    }
                  >
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-gray-300">{campaign.description}</p>

                {campaign.thumbnail_url && (
                  <img
                    src={campaign.thumbnail_url}
                    alt={campaign.title}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>
                    <strong>Created by:</strong> {campaign.users?.email || campaign.user_id}
                  </div>
                  <div>
                    <strong>Max participants:</strong> {campaign.max_participants || "Unlimited"}
                  </div>
                  <div>
                    <strong>Total diamonds reserved:</strong> {campaign.total_diamonds || 0}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(campaign.created_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap justify-end gap-3">
                {campaign.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        handleAction(
                          campaign.id,
                          "reject",
                          campaign.total_diamonds,
                          campaign.user_id
                        )
                      }
                      disabled={processing === campaign.id}
                    >
                      {processing === campaign.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject & Refund
                    </Button>

                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleAction(campaign.id, "approve")}
                      disabled={processing === campaign.id}
                    >
                      {processing === campaign.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </>
                )}

                {campaign.status !== "completed" && (
                  <Button
                    variant="outline"
                    className="border-purple-600 text-purple-400 hover:bg-purple-950"
                    onClick={() => handleAction(campaign.id, "complete")}
                    disabled={processing === campaign.id}
                  >
                    {processing === campaign.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckSquare className="mr-2 h-4 w-4" />
                    )}
                    Mark as Completed
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}