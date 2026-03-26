"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X } from "lucide-react";
import { useSupabase } from "@/lib/supabase-client";
import { useUser } from "@clerk/nextjs";

export default function CreateCampaignPage() {
  const { user } = useUser();
  const supabase = useSupabase();
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([""]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [rewardPerTask, setRewardPerTask] = useState<{ [key: string]: number }>({});
  const [maxParticipants, setMaxParticipants] = useState<number>(50);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Task definitions
  const tasks = [
    { id: "like", label: "Like", defaultReward: 8 },
    { id: "retweet", label: "Retweet", defaultReward: 10 },
    { id: "comment", label: "Comment", defaultReward: 10 },
    { id: "follow", label: "Follow", defaultReward: 10 },
    { id: "quote", label: "Quote Tweet", defaultReward: 12 },
  ];

  // Total = (sum of rewards) × max participants
  const totalDiamonds = selectedTasks.reduce((sum, taskId) => {
    const reward = rewardPerTask[taskId] ?? tasks.find(t => t.id === taskId)?.defaultReward ?? 0;
    return sum + reward;
  }, 0) * maxParticipants;

  // Thumbnail
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large (max 5MB)");
      return;
    }
    setThumbnail(file);
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Links
  const addLinkField = () => { if (links.length < 6) setLinks([...links, ""]); };
  const removeLinkField = (index: number) => setLinks(links.filter((_, i) => i !== index));
  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  // Tasks
  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        const newRewards = { ...rewardPerTask };
        delete newRewards[taskId];
        setRewardPerTask(newRewards);
        return prev.filter(id => id !== taskId);
      } else {
        setRewardPerTask(prev => ({ ...prev, [taskId]: tasks.find(t => t.id === taskId)?.defaultReward ?? 0 }));
        return [...prev, taskId];
      }
    });
  };

  const handleRewardChange = (taskId: string, value: number) => {
    setRewardPerTask(prev => ({ ...prev, [taskId]: value }));
  };

  // Submit - deducts diamonds immediately
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !thumbnail || links.every(l => !l.trim()) || selectedTasks.length === 0) {
      alert("Please fill all required fields");
      return;
    }

    if (maxParticipants < 1) {
      alert("Maximum participants must be at least 1");
      return;
    }

    if (!user?.id) {
      alert("Please log in");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check balance
      const { data: userData } = await supabase.from("users").select("diamonds_balance").eq("id", user.id).single();
      if (!userData || userData.diamonds_balance < totalDiamonds) {
        alert(`Insufficient balance! You need ${totalDiamonds} diamonds.`);
        return;
      }

      // Deduct diamonds immediately
      const { error: deductError } = await supabase.rpc("decrement_balance", {
        user_id_param: user.id,
        amount_param: totalDiamonds,
      });
      if (deductError) throw deductError;

      // Upload thumbnail
      const fileExt = thumbnail.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("campaigns").upload(filePath, thumbnail);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("campaigns").getPublicUrl(filePath);
      const thumbnailUrl = urlData.publicUrl;

      // Format tasks
      const formattedTasks = selectedTasks.map(id => ({
        type: id,
        reward: rewardPerTask[id] ?? tasks.find(t => t.id === id)?.defaultReward ?? 0,
      }));

      // Insert campaign
      const { error: insertError } = await supabase.from("campaigns").insert({
        title,
        description,
        thumbnail_url: thumbnailUrl,
        links: links.filter(Boolean),
        tasks: formattedTasks,
        max_participants: maxParticipants,
        total_diamonds: totalDiamonds,
        status: "pending",
        user_id: user.id,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        // Refund if insert fails
        await supabase.rpc("increment_balance", { user_id_param: user.id, amount_param: totalDiamonds });
        throw insertError;
      }

      alert("Campaign submitted for review! Diamonds have been deducted from your balance.");

      // Reset form
      setTitle(""); setDescription(""); setThumbnail(null); setThumbnailPreview(null);
      setLinks([""]); setSelectedTasks([]); setRewardPerTask({}); setMaxParticipants(50);
    } catch (error: any) {
      console.error("Error:", error);
      alert("Failed to create campaign. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Create New Campaign</h1>
      <p className="text-gray-400 mb-8">
        Add title, description, thumbnail, links, rewards, and maximum participants. 
        Total diamonds will be deducted upfront from your balance.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title & Description */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Give your campaign a title and brief description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input id="title" placeholder="$50 Giveaway – Engage & Win!" value={title} onChange={e => setTitle(e.target.value)} required className="bg-[#1a1a1a] border-gray-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" placeholder="Engage with the tweet below..." value={description} onChange={e => setDescription(e.target.value)} rows={4} required className="bg-[#1a1a1a] border-gray-700 text-white resize-none" />
            </div>
          </CardContent>
        </Card>

        {/* Thumbnail */}
        <Card>
          <CardHeader>
            <CardTitle>Thumbnail Image</CardTitle>
            <CardDescription>Upload a preview image (max 5MB, JPG/PNG)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {thumbnailPreview ? (
                <div className="relative w-48 h-48 mx-auto">
                  <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover rounded-lg border border-gray-700" />
                  <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => {setThumbnail(null); setThumbnailPreview(null);}}>Remove</Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
                  <Label htmlFor="thumbnail" className="cursor-pointer text-gray-400 hover:text-white transition">Click to upload thumbnail</Label>
                  <Input id="thumbnail" type="file" accept="image/jpeg,image/png" onChange={handleThumbnailChange} className="hidden" />
                  <p className="text-sm text-gray-500 mt-2">Max 5MB</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Links</CardTitle>
            <CardDescription>Add up to 6 links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {links.map((link, index) => (
              <div key={index} className="flex items-center gap-3">
                <Input placeholder={`Link ${index + 1}`} value={link} onChange={e => updateLink(index, e.target.value)} className="bg-[#1a1a1a] border-gray-700 text-white flex-1" />
                {links.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeLinkField(index)}><X className="h-5 w-5" /></Button>}
              </div>
            ))}
            {links.length < 6 && <Button type="button" variant="outline" onClick={addLinkField} className="w-full border-gray-700 hover:bg-gray-800">+ Add Another Link</Button>}
          </CardContent>
        </Card>

        {/* Tasks & Rewards + Max Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Types & Rewards</CardTitle>
            <CardDescription>Choose actions, set reward per completion, and maximum participants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Max Participants */}
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Maximum number of participants *</Label>
              <Input id="maxParticipants" type="number" min="1" value={maxParticipants} onChange={e => setMaxParticipants(Math.max(1, Number(e.target.value)))} className="bg-[#1a1a1a] border-gray-700 text-white" />
              <p className="text-sm text-gray-400">Only this many people can complete the campaign</p>
            </div>

            {/* Tasks with always-visible reward box */}
            {tasks.map(task => (
              <div key={task.id} className="flex items-start space-x-3">
                <Checkbox id={task.id} checked={selectedTasks.includes(task.id)} onCheckedChange={() => handleTaskToggle(task.id)} className="mt-1 border-gray-600 data-[state=checked]:bg-[#caf403] data-[state=checked]:border-[#caf403]" />
                <div className="flex-1 space-y-1">
                  <label htmlFor={task.id} className="text-base font-medium leading-none">{task.label}</label>
                  <p className="text-sm text-gray-400">Diamonds per completion</p>

                  {/* Reward box - ALWAYS visible when checked, with default placeholder */}
                  {selectedTasks.includes(task.id) && (
                    <Input
                      type="number"
                      min="1"
                      placeholder={`Default: ${task.defaultReward}`}
                      value={rewardPerTask[task.id] ?? task.defaultReward}
                      onChange={e => handleRewardChange(task.id, Number(e.target.value))}
                      className="w-32 bg-[#1a1a1a] border-gray-700 text-white mt-2"
                    />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-lg">
                <span>Total Diamonds Required:</span>
                <span className="font-bold text-[#caf403]">{totalDiamonds}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Max participants:</span>
                <span>{maxParticipants}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t border-gray-800 pt-4">
                <span>Total to be deducted from your balance:</span>
                <span className="text-[#caf403]">{totalDiamonds}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !user} className="w-full bg-[#caf403] hover:bg-[#a0d900] text-black py-6 text-lg font-semibold disabled:opacity-50">
              {isSubmitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}