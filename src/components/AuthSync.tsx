"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { syncUserProfile } from "@/app/actions/user-sync";

export function AuthSync() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const runSync = async () => {
      try {
        console.log("Full sign-in confirmed - starting sync");
        const result = await syncUserProfile();

        if (result.error) {
          console.error("Server sync error:", result.error);
        } else {
          console.log("User profile synced via server");
        }
      } catch (err) {
        console.error("Sync call failed:", err);
      }
    };

    runSync();
  }, [isLoaded, isSignedIn, user]);

  return null;
}