// "use client";

// import { useState, useRef, useEffect } from "react";
// import { Send, Leaf, Sprout, Sun, CloudRain, Bug, Wheat, MessageCircle } from "lucide-react";

// const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// const SUGGESTIONS = [
//   { icon: Bug,       text: "How to treat aphids on tomatoes?" },
//   { icon: Wheat,     text: "Best fertilizer for wheat crop?" },
//   { icon: CloudRain, text: "Crop care during monsoon season?" },
//   { icon: Sun,       text: "Irrigation tips for summer crops?" },
// ];

// interface Message {
//   role: "user" | "bot";
//   text: string;
// }

// export default function AgriChatPage() {
//   const [messages,  setMessages]  = useState<Message[]>([]);
//   const [input,     setInput]     = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const bottomRef  = useRef<HTMLDivElement>(null);
//   const inputRef   = useRef<HTMLTextAreaElement>(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isLoading]);

//   // Auto-resize textarea
//   const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     setInput(e.target.value);
//     e.target.style.height = "auto";
//     e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
//   };

//   const sendMessage = async (text?: string) => {
//     const msg = (text || input).trim();
//     if (!msg || isLoading) return;

//     setMessages(prev => [...prev, { role: "user", text: msg }]);
//     setInput("");
//     if (inputRef.current) inputRef.current.style.height = "auto";
//     setIsLoading(true);

//     try {
//       const res  = await fetch(`${API}/api/ai/chat`, {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body:    JSON.stringify({ message: msg }),
//       });
//       const data = await res.json();
//       setMessages(prev => [...prev, {
//         role: "bot",
//         text: data.success ? data.reply : `Error: ${data.error}`,
//       }]);
//     } catch {
//       setMessages(prev => [...prev, {
//         role: "bot",
//         text: "Sorry, I'm having trouble connecting to the server.",
//       }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const isEmpty = messages.length === 0;

//   return (
//     <div className="flex flex-col h-[calc(100vh-57px)] bg-gray-50 dark:bg-gray-950">

//       {/* ── Header ── */}
//       <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-3">
//         <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-sm">
//           <Leaf className="w-4 h-4 text-white" />
//         </div>
//         <div>
//           <h1 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Agri Expert</h1>
//           <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Powered by AI · Always available</p>
//         </div>
//         <div className="ml-auto flex items-center gap-1.5">
//           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
//           <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
//         </div>
//       </div>

//       {/* ── Messages area ── */}
//       <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">

//         {/* Empty state */}
//         {isEmpty && (
//           <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
//             <div className="text-center">
//               <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
//                 <Sprout className="w-8 h-8 text-white" />
//               </div>
//               <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Namaste, Farmer! 🌾</h2>
//               <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
//                 Ask me anything about crops, diseases, irrigation, or farming tips.
//               </p>
//             </div>

//             {/* Suggestion chips */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
//               {SUGGESTIONS.map(({ icon: Icon, text }) => (
//                 <button
//                   key={text}
//                   onClick={() => sendMessage(text)}
//                   className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-left text-sm text-gray-700 dark:text-gray-300 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-150 shadow-sm"
//                 >
//                   <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
//                   <span className="leading-snug">{text}</span>
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Messages */}
//         {messages.map((m, i) => (
//           <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
//             {m.role === "bot" && (
//               <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
//                 <Leaf className="w-3.5 h-3.5 text-white" />
//               </div>
//             )}
//             <div className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
//               m.role === "user"
//                 ? "bg-emerald-600 text-white rounded-br-sm"
//                 : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-bl-sm"
//             }`}>
//               <p className="whitespace-pre-wrap">{m.text}</p>
//             </div>
//             {m.role === "user" && (
//               <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
//                 <MessageCircle className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
//               </div>
//             )}
//           </div>
//         ))}

//         {/* Typing indicator */}
//         {isLoading && (
//           <div className="flex gap-2 justify-start">
//             <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
//               <Leaf className="w-3.5 h-3.5 text-white" />
//             </div>
//             <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
//               <div className="flex items-center gap-1">
//                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
//                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
//                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
//               </div>
//             </div>
//           </div>
//         )}

//         <div ref={bottomRef} />
//       </div>

//       {/* ── Input bar ── */}
//       <div className="shrink-0 px-3 sm:px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
//         <div className="flex items-end gap-2 max-w-4xl mx-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2 focus-within:border-emerald-400 dark:focus-within:border-emerald-600 transition-colors">
//           <textarea
//             ref={inputRef}
//             value={input}
//             onChange={handleInput}
//             onKeyDown={handleKey}
//             placeholder="Ask about crops, pests, or farming tips..."
//             rows={1}
//             className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 py-1.5 max-h-[120px]"
//           />
//           <button
//             onClick={() => sendMessage()}
//             disabled={!input.trim() || isLoading}
//             className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 mb-0.5"
//           >
//             <Send className="w-3.5 h-3.5 text-white disabled:text-gray-400" />
//           </button>
//         </div>
//         <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-2">
//           Press Enter to send · Shift+Enter for new line
//         </p>
//       </div>

//     </div>
//   );
// }



"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Leaf, Sprout, Sun, CloudRain, Bug, Wheat, MessageCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://10.42.0.1:5000";
console.log("Using API:", API);

const SUGGESTIONS = [
  { icon: Bug,       text: "How to treat aphids on tomatoes?" },
  { icon: Wheat,     text: "Best fertilizer for wheat crop?" },
  { icon: CloudRain, text: "Crop care during monsoon season?" },
  { icon: Sun,       text: "Irrigation tips for summer crops?" },
];

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function AgriChatPage() {
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Reset parent scroll to top when page loads
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsLoading(true);
    try {
      const res  = await fetch(`${API}/api/ai/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "bot",
        text: data.success ? data.reply : `Error: ${data.error}`,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "bot",
        text: "Sorry, I'm having trouble connecting to the server.",
      }]);
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

  const isEmpty = messages.length === 0;

  // KEY FIX: use viewport height minus header (h-14 = 56px)
  // This makes chat fill exactly the screen — footer never shows unless user scrolls main
  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>

      {/* Chat header */}
      <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-sm">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Agri Expert</h1>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Powered by GROQ AI · Always available</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
        </div>
      </div>

      {/* Messages — scrollable, scrollbar hidden */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-3 sm:px-6 py-4 space-y-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sprout className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">HELLO! 🌾</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                Ask me anything about crops, diseases, irrigation, or farming tips.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-left text-sm text-gray-700 dark:text-gray-300 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-150 shadow-sm"
                >
                  <Icon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="leading-snug">{text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "bot" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Leaf className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
              m.role === "user"
                ? "bg-emerald-600 text-white rounded-br-sm"
                : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-bl-sm"
            }`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-3 sm:px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-end gap-2 max-w-4xl mx-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2 focus-within:border-emerald-400 dark:focus-within:border-emerald-600 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Ask about crops, pests, or farming tips..."
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 py-1.5 max-h-[120px]"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0 mb-0.5"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>

    </div>
  );
}