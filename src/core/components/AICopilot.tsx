import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Send, Bot, ChevronDown, Mic, Loader2 } from "lucide-react";

interface CopilotAction {
  type: "navigate" | "filter" | "focus" | "info";
  label: string;
  value?: string;
}

interface CopilotResponse {
  message: string;
  action?: CopilotAction;
}

// Simulated page-agent style command parsing
function parseCopilotCommand(input: string): CopilotResponse {
  const lower = input.toLowerCase();

  if (lower.includes("high risk") || lower.includes("critical") || lower.includes("urgent")) {
    return {
      message: "Filtering queue to show only HIGH RISK patients. They are sorted at the top of your queue with red badges.",
      action: { type: "filter", label: "Filter: HIGH RISK", value: "HIGH" }
    };
  }
  if (lower.includes("pending") || lower.includes("waiting") || lower.includes("queue")) {
    return {
      message: "Showing all pending appointments in your queue. You can Accept, Reject, or Start Consultation for each.",
      action: { type: "navigate", label: "Show pending queue", value: "pending" }
    };
  }
  if (lower.includes("check") && lower.includes("in")) {
    return {
      message: "Highlighting patients who have completed voice check-in. Their AI summaries are ready for review.",
      action: { type: "filter", label: "Filter: Checked-In", value: "checkedIn" }
    };
  }
  if (lower.includes("summary") || lower.includes("ai summary") || lower.includes("triage")) {
    return {
      message: "Expanding all patient cards to show AI-generated triage summaries. Look for the blue summary panel in each card.",
      action: { type: "focus", label: "View AI Summaries" }
    };
  }
  if (lower.includes("chart") || lower.includes("distribution") || lower.includes("analytics") || lower.includes("stats")) {
    return {
      message: "The risk distribution donut chart is in the right sidebar. It shows the breakdown of HIGH, MEDIUM and LOW risk patients for today.",
      action: { type: "navigate", label: "View Risk Chart", value: "chart" }
    };
  }
  if (lower.includes("refresh") || lower.includes("update") || lower.includes("reload")) {
    return {
      message: "Refreshing the patient queue now. Live updates via WebSocket are active.",
      action: { type: "navigate", label: "Refresh Queue", value: "refresh" }
    };
  }
  if (lower.includes("prescription") || lower.includes("prescribe")) {
    return {
      message: "To send a prescription: Click 'Start Consultation' on a patient → fill the prescription form → click 'End & Send Prescription'. The PDF will be emailed instantly.",
      action: { type: "info", label: "Prescription Guide" }
    };
  }
  if (lower.includes("whiteboard") || lower.includes("draw") || lower.includes("canvas")) {
    return {
      message: "The digital whiteboard is available inside the Active Consultation screen. Click 'Start Consultation' on any patient to access it.",
      action: { type: "info", label: "Whiteboard Info" }
    };
  }
  if (lower.includes("imaging") || lower.includes("xray") || lower.includes("x-ray") || lower.includes("scan") || lower.includes("mri")) {
    return {
      message: "Medical imaging analysis is available in the Active Consultation screen. Drag and drop an X-ray or MRI to get instant Gemini AI analysis.",
      action: { type: "info", label: "Imaging Info" }
    };
  }
  if (lower.includes("today") || lower.includes("appointments")) {
    return {
      message: "You can see Today's Summary in the right sidebar — total patients, checked-in count, and how many have AI summaries.",
      action: { type: "navigate", label: "Today's Summary" }
    };
  }
  // Default
  return {
    message: `I can help you navigate the dashboard. Try commands like:\n• "Show high risk patients"\n• "Who has checked in?"\n• "Show AI summaries"\n• "How do I send a prescription?"\n• "Refresh the queue"`,
    action: undefined
  };
}

interface Message { role: "user" | "ai"; text: string; action?: CopilotAction; }

interface Props {
  onAction?: (action: CopilotAction) => void;
}

export function AICopilot({ onAction }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hi Doctor! I'm your AI Copilot. I can help you navigate the dashboard, filter patients, and find information. What do you need?" }
  ]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    // Simulate AI thinking
    await new Promise(r => setTimeout(r, 600));
    const response = parseCopilotCommand(userMsg);
    setMessages(m => [...m, { role: "ai", text: response.message, action: response.action }]);
    setLoading(false);
    if (response.action && onAction) onAction(response.action);
  };

  const quickCommands = [
    "Show high risk patients",
    "Who has checked in?",
    "How to send prescription?",
  ];

  return (
    <>
      {/* Toggle Button */}
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${open ? "bg-red-700 text-white border-red-600 shadow-lg shadow-red-600/20" : "bg-zinc-900 text-zinc-400 border-white/[0.08] hover:bg-zinc-800 hover:text-white"}`}>
        <Sparkles className={`w-4 h-4 ${open ? "text-white" : "text-red-500"}`} />
        AI Copilot
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-14 right-4 w-80 sm:w-96 z-50 bg-black/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/[0.08] overflow-hidden flex flex-col"
            style={{ maxHeight: "480px" }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-zinc-900 to-indigo-950 px-5 py-4 flex items-center gap-3 border-b border-white/[0.05]">
              <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center border border-red-600/20">
                <Bot className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-white font-black text-xs uppercase tracking-widest">AI Copilot Core</div>
                <div className="text-zinc-500 text-[10px] font-black uppercase tracking-tighter">Autonomous GUI Agent Active</div>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="w-7 h-7 bg-gradient-to-br from-red-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1 shadow-lg shadow-red-600/20">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className={`max-w-[85%] space-y-2`}>
                    <div className={`px-4 py-3 rounded-2xl text-[11px] font-medium leading-relaxed whitespace-pre-line ${msg.role === "ai" ? "bg-white/[0.03] text-zinc-300 rounded-tl-sm border border-white/[0.05]" : "bg-red-700 text-white rounded-tr-sm shadow-xl shadow-red-600/20"}`}>
                      {msg.text}
                    </div>
                    {msg.action && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 text-red-500 rounded-xl border border-red-600/20 text-[10px] font-black uppercase tracking-widest">
                        <Sparkles className="w-3 h-3" /> {msg.action.label}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-red-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl rounded-tl-sm px-3 py-2.5 border border-white/[0.05] flex gap-1">
                    {[0, 150, 300].map(d => <div key={d} className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick commands */}
            {messages.length <= 1 && (
              <div className="px-4 pb-4 flex flex-wrap gap-1.5">
                {quickCommands.map(cmd => (
                  <button key={cmd} onClick={() => { setInput(cmd); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="px-3 py-1.5 bg-white/[0.03] text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/[0.05] hover:bg-white/[0.08] hover:text-white transition-all">
                    {cmd}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/[0.05] flex items-center gap-2 bg-black/40">
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Type a command…"
                className="flex-1 px-4 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.08] text-[11px] font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600/50" />
              <button onClick={send} disabled={!input.trim() || loading}
                className="w-10 h-10 bg-red-700 text-white rounded-xl flex items-center justify-center hover:bg-red-600 disabled:opacity-20 transition-all shadow-xl shadow-red-600/10">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
