"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Leaf,
  Sprout,
  Sun,
  CloudRain,
  Bug,
  Wheat,
  MessageCircle,
  Sparkles,
  Clock3,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

const SUGGESTIONS = [
  { icon: Bug, text: "How do I control aphids in tomato crops naturally?" },
  { icon: Wheat, text: "Suggest the best fertilizer schedule for wheat." },
  { icon: CloudRain, text: "What should farmers do before heavy rain?" },
  { icon: Sun, text: "How often should I irrigate during summer?" },
];

interface Message {
  role: "user" | "bot";
  text: string;
  timestamp: string;
}

function formatNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AgriChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [draftLines, setDraftLines] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const resizeInput = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    const nextHeight = Math.min(element.scrollHeight, 144);
    element.style.height = `${nextHeight}px`;
    setDraftLines(Math.max(1, Math.min(5, Math.round(nextHeight / 24))));
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    resizeInput(e.target);
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: msg, timestamp: formatNow() }]);
    setInput("");
    setDraftLines(1);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      const res = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.success ? data.reply : `Error: ${data.error}`,
          timestamp: formatNow(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Sorry, I could not connect to the server. Please try again in a moment.",
          timestamp: formatNow(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(to_bottom,_#f8fafc,_#f1f5f9)] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(to_bottom,_#030712,_#111827)]">
      <div className="border-b border-gray-200/80 bg-white/85 px-4 py-3 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/85 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-lime-500 shadow-lg shadow-emerald-500/20">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Agri Expert</h1>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">Powered by Groq AI</p>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col px-3 py-4 sm:px-6">
        <div
          ref={listRef}
          className="hide-scrollbar min-h-[420px] overflow-y-auto rounded-[28px] border border-gray-200/80 bg-white/55 px-4 py-5 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/45"
          style={{ maxHeight: "58vh", overscrollBehavior: "contain" }}
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-2">
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-7 pb-2">
              <div className="max-w-xl text-center">
                <div className="mx-auto mb-4 flex h-18 w-18 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-400 via-green-500 to-lime-500 shadow-xl shadow-emerald-500/20">
                  <Sprout className="h-9 w-9 text-white" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  Smarter farming help, instantly
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Ask about crop diseases, irrigation, fertilizer schedules, pest treatment, or weather-based farm decisions.
                </p>
              </div>

              <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(text)}
                    className="group rounded-2xl border border-gray-200 bg-white/90 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80 dark:hover:border-emerald-500/40"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium leading-6 text-gray-800 dark:text-gray-200">{text}</p>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 dark:border-gray-800 dark:bg-gray-900">English by default</span>
                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 dark:border-gray-800 dark:bg-gray-900">Ask in any language</span>
                <span className="rounded-full border border-gray-200 bg-white px-3 py-1 dark:border-gray-800 dark:bg-gray-900">Farmer-focused answers</span>
              </div>
            </div>

            {messages.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-gray-200/80 pt-4 dark:border-gray-800">
                {messages.map((m, i) => (
                  <div key={`${m.role}-${i}`} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "bot" && (
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-lime-500 shadow-md shadow-emerald-500/20">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[86%] rounded-3xl px-4 py-3 shadow-sm sm:max-w-[74%] ${
                        m.role === "user"
                          ? "rounded-br-md bg-emerald-600 text-white"
                          : "rounded-bl-md border border-gray-200 bg-white text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-7">{m.text}</p>
                      <div className={`mt-2 flex items-center gap-1 text-[11px] ${m.role === "user" ? "text-emerald-100/90" : "text-gray-400 dark:text-gray-500"}`}>
                        <span className="text-[10px] leading-none tracking-[-0.18em]">✓✓</span>
                        {m.timestamp}
                      </div>
                    </div>

                    {m.role === "user" && (
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-lime-500 shadow-md shadow-emerald-500/20">
                      <Leaf className="h-4 w-4 text-white" />
                    </div>
                    <div className="rounded-3xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "120ms" }} />
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "240ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 pb-6 pt-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-gray-50 shadow-sm transition-colors focus-within:border-emerald-400 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-end gap-3 px-4 py-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKey}
                placeholder="Ask about crops, pests, irrigation, fertilizer, or diseases..."
                rows={1}
                className="max-h-36 min-h-[28px] flex-1 resize-none bg-transparent py-1 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200/70 px-4 py-2 text-[11px] text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <span>Enter to send, Shift+Enter for a new line</span>
              <span>{draftLines}/5 lines</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
