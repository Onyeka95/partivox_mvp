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
        const email = user.emailAddresses[0]?.emailAddress || "";

        console.log("Full sign-in confirmed - starting sync for:", email);

        const result = await syncUserProfile({
          id: user.id,
          email: email,
        });

        if (result.success) {
          console.log("✅ User profile synced successfully via server");
        } else {
          console.error("❌ Server sync failed:", result.error);
        }
      } catch (err) {
        console.error("Sync call failed:", err);
      }
    };

    runSync();
  }, [isLoaded, isSignedIn, user]);

  return null;
}