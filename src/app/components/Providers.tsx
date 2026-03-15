"use client";

// SessionProvider from next-auth/react causes a duplicate React instance
// in Next.js 15.5+ — do NOT use it.
// Google OAuth is triggered via direct URL redirect in LoginPage.tsx.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}