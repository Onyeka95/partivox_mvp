"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MyCampaignsPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getSupabaseWithToken = async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("No auth token");

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
  };

  useEffect(() => {
    if (!isLoaded || !user?.id) {
      setLoading(false);
      return;
    }

    const fetchMyCampaigns = async () => {
      try {
        setLoading(true);
        const supabaseWithToken = await getSupabaseWithToken();

        const { data, error } = await supabaseWithToken
          .from("campaigns")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setCampaigns(data || []);
      } catch (err: any) {
        console.error("Error fetching my campaigns:", err);
        toast.error("Failed to load your campaigns");
      } finally {
        setLoading(false);
      }
    };

    fetchMyCampaigns();
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#caf403]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">My Campaigns</h1>
        <p className="text-gray-400 mb-8">
          Track the status of the campaigns you've created.
        </p>

        {campaigns.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400 mb-4">
              You haven't created any campaigns yet.
            </p>
            <Link href="/dashboard/campaigns">
              <Button className="bg-[#caf403] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#b0e000]">
                Create Your First Campaign
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="bg-[#1a1a1a] border border-gray-800 overflow-hidden hover:border-gray-600 transition-all duration-300"
              >
                {campaign.thumbnail_url && (
                  <img
                    src={campaign.thumbnail_url}
                    alt={campaign.title}
                    className="w-full h-48 object-cover"
                  />
                )}

                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-white line-clamp-2">
                      {campaign.title}
                    </CardTitle>
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
                      {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-300 line-clamp-4 text-sm mb-4">
                    {campaign.description}
                  </p>
                </CardContent>

                <CardFooter>
                  <Link href={`/dashboard/claim/${campaign.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      View Details
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