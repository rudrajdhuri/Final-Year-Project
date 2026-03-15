"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User, Leaf, Loader2, Check, X, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth, sha256, getGuestHistory, clearGuestHistory } from "../components/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const rules = [
  { label: "At least 8 characters",  test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter",   test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter",   test: (p: string) => /[a-z]/.test(p) },
  { label: "One digit",              test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character",  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
      type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
    }`}>
      {type === "success" && <CheckCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const handleGoogle = async () => {
    setGLoading(true);
    await signIn("google", { callbackUrl: "/auth/google-callback" });
  };
  const [toast,    setToast]    = useState<{ message: string; type: "success"|"error" } | null>(null);

  const allRulesMet = rules.every(r => r.test(password));

  const showToast = (message: string, type: "success"|"error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesMet) { setError("Password does not meet requirements"); return; }
    setError(""); setLoading(true);

    try {
      const hashedPwd    = await sha256(password);
      const guestHistory = getGuestHistory();

      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: hashedPwd, guest_history: guestHistory }),
      });

      const data = await res.json();
      if (!data.success) { setError(data.error || "Sign up failed"); return; }

      login(data.user);
      clearGuestHistory();
      showToast(`Account created! Welcome, ${data.user.name}! 🎉`, "success");
      setTimeout(() => router.push("/"), 1200);
    } catch {
      setError("Connection failed. Is Flask running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">

      {toast && <Toast {...toast} />}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">AGRI BOT</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-57px)]">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Create account</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Join AgriBot to save your detection history</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Name</label>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 gap-2 focus-within:border-emerald-500 transition-colors">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name" required minLength={2}
                    className="w-full bg-transparent outline-none py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Email</label>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 gap-2 focus-within:border-emerald-500 transition-colors">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full bg-transparent outline-none py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Password</label>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 gap-2 focus-within:border-emerald-500 transition-colors">
                  <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                  <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPwdFocus(true)} placeholder="••••••••" required
                    className="w-full bg-transparent outline-none py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400" />
                  <button type="button" onClick={() => setShowPwd(s => !s)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwdFocus && password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {rules.map((rule, i) => {
                      const met = rule.test(password);
                      return (
                        <div key={i} className={`flex items-center gap-1.5 text-xs ${met ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-600"}`}>
                          {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {rule.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
              )}

              <button type="submit" disabled={loading || !allRulesMet}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</> : "Create Account"}
              </button>
            </form>

            <div className="mt-4">
              <div className="relative flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
              </div>
              <button onClick={handleGoogle} disabled={gLoading}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 flex items-center justify-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60">
                {gLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-5 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}