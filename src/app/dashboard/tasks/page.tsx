"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function TaskFeedPage() {
  const { user, isLoaded } = useUser();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .neq("status", "completed")  // ← Hide completed campaigns
          .order("created_at", { ascending: false });

        if (error) throw error;

        setCampaigns(data || []);
      } catch (err: any) {
        console.error("Error fetching campaigns:", err);
        setError(err.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    fetchCampaigns();
  }, []);

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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Available Tasks</h1>
        <p className="text-gray-400 mb-12">
          Browse campaigns and earn diamonds by completing simple engagements.
        </p>

        {campaigns.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-xl">
            No active campaigns available right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="bg-[#1a1a1a] border border-gray-800 overflow-hidden hover:border-gray-600 transition-all duration-300 flex flex-col"
              >
                {campaign.thumbnail_url && (
                  <img
                    src={campaign.thumbnail_url}
                    alt={campaign.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white line-clamp-2">
                    {campaign.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 line-clamp-2 text-sm">
                    {campaign.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow pb-2">
                  {/* Compact max participants box */}
                  <div className="bg-[#0f0f0f] p-3 rounded-lg border border-gray-700 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Max participants:</span>
                      <span className="font-medium text-[#caf403]">
                        {campaign.max_participants || "Unlimited"}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Link href={`/dashboard/claim/${campaign.id}`} className="w-full">
                    <Button className="w-full bg-[#caf403] hover:bg-[#a0d900] text-black py-5 text-base">
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