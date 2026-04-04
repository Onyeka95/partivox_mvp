"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";

export default function MyClaimsPage() {
  const { user, isLoaded } = useUser();

  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard: don't run fetch until user is loaded and has an ID
    if (!isLoaded || !user?.id) {
      setLoading(false);
      return;
    }

    async function fetchMyClaims() {
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
          .eq("user_id", user!.id)          // ← safe after guard + ! assertion
          .order("created_at", { ascending: false });

        if (error) throw error;

        setClaims(data || []);
      } catch (err: any) {
        console.error("Fetch claims error:", err);
        setError(err.message || "Failed to load your claims");
      } finally {
        setLoading(false);
      }
    }

    fetchMyClaims();
  }, [isLoaded, user]);

  // Show loading while Clerk is still checking auth
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-[#caf403]" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-gray-800">
        <p className="text-xl text-gray-400 mb-4">
          Please log in to view your claims.
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p className="text-xl mb-4">Error loading claims</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Claims</h1>
        <p className="text-gray-400">
          Track the campaigns and tasks you've submitted for review.
        </p>
      </div>

      {claims.length === 0 ? (
        <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <p className="text-xl text-gray-400 mb-4">
            You haven't submitted any claims yet.
          </p>
          <p className="text-gray-500">
            Go to the Task Feed and start engaging with campaigns!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {claims.map((claim) => (
            <Card
              key={claim.id}
              className="bg-[#1a1a1a] border border-gray-800 overflow-hidden hover:border-gray-600 transition-all"
            >
              {claim.campaigns?.thumbnail_url && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={claim.campaigns.thumbnail_url}
                    alt={claim.campaigns.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-2 pr-2 text-white">
                    {claim.campaigns?.title || "Campaign"}
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
                        ? "bg-green-600 hover:bg-green-600"
                        : claim.status === "rejected"
                        ? "bg-red-600 hover:bg-red-600"
                        : "bg-yellow-600 hover:bg-yellow-600"
                    }
                  >
                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription className="text-sm text-gray-400 mt-1">
                  Task: <span className="capitalize">{claim.task_type}</span> •{" "}
                  {new Date(claim.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-4 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Reward:</span>
                  <span className="font-medium text-[#caf403]">{claim.reward} diamonds</span>
                </div>

                {claim.twitter_handle && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Twitter:</span>
                    <a
                      href={`https://x.com/${claim.twitter_handle.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#caf403] hover:underline flex items-center gap-1"
                    >
                      {claim.twitter_handle}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}

                {claim.screenshot_url && (
                  <div>
                    <p className="text-sm text-gray-300 mb-2">Proof screenshot:</p>
                    <div className="relative rounded-lg overflow-hidden border border-gray-700">
                      <img
                        src={claim.screenshot_url}
                        alt="Proof screenshot"
                        className="w-full h-40 object-cover"
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}