"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TaskFeedPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSupabaseWithToken = async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("Authentication token missing");

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    );
  };

  useEffect(() => {
    async function fetchCampaigns() {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const supabaseWithToken = await getSupabaseWithToken();

        const { data, error } = await supabaseWithToken
          .from("campaigns")
          .select("id, title, description, thumbnail_url")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setCampaigns(data || []);
      } catch (err: any) {
        console.error("Error fetching campaigns:", err);
        setError(err.message || "Failed to load tasks");
        toast.error("Failed to load available tasks");
      } finally {
        setLoading(false);
      }
    }

    fetchCampaigns();
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#caf403]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">Error loading tasks</p>
          <p className="text-gray-400">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-6">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Available Tasks</h1>
        <p className="text-gray-400 mb-10">
          Browse campaigns and earn diamonds by completing simple engagements.
        </p>

        {campaigns.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-xl">
            No active campaigns available right now.<br />
            Check back later!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="bg-[#1a1a1a] border border-gray-800 hover:border-[#caf403] transition-all flex flex-col h-full"
              >
                {campaign.thumbnail_url && (
                  <img
                    src={campaign.thumbnail_url}
                    alt={campaign.title}
                    className="w-full h-40 object-cover"
                  />
                )}

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2 leading-tight text-white">
                    {campaign.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-grow">
                  <p className="text-gray-400 text-sm line-clamp-4">
                    {campaign.description}
                  </p>
                </CardContent>

                <CardFooter className="pt-4">
                  <Link href={`/dashboard_user/claim/${campaign.id}`} className="w-full">
                    <Button className="w-full bg-[#caf403] hover:bg-[#b0e000] text-black py-5 font-semibold">
                      Start Tasks
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}