"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, getGuestHistory, clearGuestHistory } from "../components/AuthContext";
import { apiFetch } from "@/lib/api";

// This page handles the Google OAuth callback
// NextAuth redirects here after successful Google login
// We fetch the session from NextAuth and save it to our AuthContext

function GoogleCallbackContent() {
  const { login } = useAuth();
  const router    = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Fetch NextAuth session
        const res  = await fetch("/api/auth/session");
        const data = await res.json();

        if (!data?.user?.email) {
          router.push("/login?error=Google+login+failed");
          return;
        }

        // Call Flask to get/create MongoDB user
        const guestHistory = getGuestHistory();
        const flaskRes = await apiFetch("/api/auth/google", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:      data.user.name,
            email:     data.user.email,
            google_id: data.user.sub || data.user.email,
            picture:   data.user.image || "",
            guest_history: guestHistory,
          }),
        });

        const flaskData = await flaskRes.json();

        if (!flaskData.success) {
          router.push(`/login?error=${encodeURIComponent(flaskData.error)}`);
          return;
        }

        // Save to our auth context
        login({
          id:       flaskData.user.id,
          name:     flaskData.user.name,
          email:    flaskData.user.email,
          picture:  flaskData.user.picture || data.user.image || "",
          provider: "google",
        });

        clearGuestHistory();
        router.push("/");
      } catch (err) {
        router.push("/login?error=Connection+failed");
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Signing in with Google...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <GoogleCallbackContent />
    </Suspense>
  );
}
