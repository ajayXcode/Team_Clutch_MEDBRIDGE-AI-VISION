import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { mockApi } from "../../lib/mockData";
import { VoiceAgent, MicPermission } from "../../lib/voice";
import { MicBlockedBanner } from "../../components/MicBlockedBanner";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, Mic, MicOff, ArrowLeft, Volume2, Send,
  Activity, AlertTriangle, CheckCircle, Loader2, SkipForward
} from "lucide-react";
import { toast } from "sonner";

const GREETING = "Initiating symptom telemetry. Please describe your condition clearly.";

interface Message { role: "ai" | "user"; text: string; }
const agent = new VoiceAgent();

export default function VoiceCheckIn() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { activePatient } = useAuth();
  const [messages, setMessages] = useState<Message[]>([{ role: "ai", text: GREETING }]);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [summary, setSummary] = useState<{ summary: string; riskLevel: string; riskScore: number; criticalFlags: string[] } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [micPermission, setMicPermission] = useState<MicPermission>("unknown");
  const [requestingMic, setRequestingMic] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Speak greeting
    setTimeout(() => {
      agent.speak(GREETING, () => setIsSpeaking(false));
      setIsSpeaking(true);
    }, 600);
    // Check existing permission silently
    agent.checkMicPermission().then(setMicPermission);
    return () => { agent.stopListening(); agent.stopSpeaking(); agent.releaseMic(); };
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (micPermission === "denied") textRef.current?.focus();
  }, [micPermission]);

  const addMessage = (role: "ai" | "user", text: string) =>
    setMessages(prev => [...prev, { role, text }]);

  const getFullTranscript = () =>
    messages.filter(m => m.role === "user").map(m => m.text).join(" ");

  const generateLocalFollowUp = (text: string, count: number): string => {
    const t = text.toLowerCase();
    if (t.includes("headache") || t.includes("head ache")) return "Headache detected. Any dizziness, blurred vision, or photophobia?";
    if (t.includes("fever") || t.includes("temperature")) return "Fever logged. What is the reading, and are there chills present?";
    if (t.includes("cold") || t.includes("cough")) return "Respiratory symptoms logged. Is there phlegm or dyspnea?";
    if (t.includes("stomach") || t.includes("pain")) return "Abdominal distress noted. Is the pain localized or sharp?";
    if (count === 1) return "Please specify the onset time and severity of these symptoms.";
    if (count === 2) return "Acknowledged. Have any pharmacological interventions been attempted?";
    return "Data logged. Do you have any additional symptoms to report before synthesis?";
  };

  const generateLocalSummary = (text: string) => {
    const t = text.toLowerCase();
    let riskLevel = "LOW";
    let riskScore = 0.25;
    let criticalFlags: string[] = [];
    
    if (t.includes("chest") || t.includes("breath") || t.includes("severe") || t.includes("high fever")) {
      riskLevel = "HIGH"; riskScore = 0.85; criticalFlags.push("Level 1 Triage Flag");
    } else if (t.includes("fever") || t.includes("stomach") || t.includes("pain")) {
      riskLevel = "MEDIUM"; riskScore = 0.55;
    }
    return { summary: `Patient reports: "${text}". Preliminary assessment complete. Recommending provider review.`, riskLevel, riskScore, criticalFlags };
  };

  const generateSummary = async () => {
    const fullText = getFullTranscript();
    if (!fullText.trim()) { toast.error("Insufficient data for synthesis"); return; }
    setGenerating(true);
    agent.stopSpeaking();
    
    // Artificial delay for "processing" feel
    setTimeout(() => {
      const result = generateLocalSummary(fullText);
      setSummary(result);
      
      const doneMsg = "Synthesis complete. Clinical node updated successfully.";
      addMessage("ai", doneMsg);
      agent.speak(doneMsg, () => setIsSpeaking(false));
      setIsSpeaking(true);
      setGenerating(false);
    }, 2000);
  };

  const handleUserInput = async (text: string) => {
    if (!text.trim()) return;
    addMessage("user", text);
    const newCount = exchangeCount + 1;
    setExchangeCount(newCount);

    if (newCount >= 3 && !summary) {
      const transitionMsg = "Sufficient data acquired. Transitioning to summary generation.";
      addMessage("ai", transitionMsg);
      agent.speak(transitionMsg, async () => { setIsSpeaking(false); await generateSummary(); });
      setIsSpeaking(true);
      return;
    }

    setLoading(true);
    // Use local follow-up for better demo stability
    setTimeout(() => {
      const fallbackMsg = generateLocalFollowUp(text, exchangeCount);
      addMessage("ai", fallbackMsg);
      agent.speak(fallbackMsg, () => setIsSpeaking(false));
      setIsSpeaking(true);
      setLoading(false);
    }, 500);
  };

  const askForMicPermission = async () => {
    setRequestingMic(true);
    const result = await agent.requestMicPermission();
    setMicPermission(result);
    setRequestingMic(false);
    if (result === "granted") beginListening();
    else textRef.current?.focus();
  };

  const beginListening = () => {
    agent.stopSpeaking(); setIsSpeaking(false);
    setIsListening(true);
    agent.startListening(
      i => setTranscript(i),
      f => { if (f.trim()) { setTranscript(""); setIsListening(false); handleUserInput(f); } },
      () => setIsListening(false),
      err => {
        setIsListening(false);
        if (err === "not-allowed") { setMicPermission("denied"); textRef.current?.focus(); }
      }
    );
  };

  const startListening = async () => {
    if (!agent.isAvailable()) { setMicPermission("unsupported"); textRef.current?.focus(); return; }
    if (micPermission === "granted") { beginListening(); return; }
    await askForMicPermission();
  };

  const stopListening = () => { agent.stopListening(); setIsListening(false); };
  const sendText = () => { if (textInput.trim()) { handleUserInput(textInput); setTextInput(""); } };
  const micBlocked = micPermission === "denied" || micPermission === "unsupported";

  const riskColors: Record<string, string> = {
    HIGH: "bg-red-500/10 border-red-500/30 text-red-400",
    MEDIUM: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    LOW: "bg-rose-600/10 border-rose-600/30 text-rose-500"
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden selection:bg-red-600/30">
      {/* Decorative Glows */}
      <div className="absolute top-[-10rem] right-[-10rem] w-[40rem] h-[40rem] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10rem] left-[-10rem] w-[30rem] h-[30rem] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="bg-zinc-900/60 backdrop-blur-2xl border-b border-white/[0.05] px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate("/patient/dashboard")} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="w-8 h-8 bg-white/[0.05] border border-red-600/30 rounded-xl flex items-center justify-center text-red-500 text-[10px] font-black uppercase shadow-[0_0_15px_rgba(220,38,38,0.2)]">AI</div>
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-white">Telemetry Sync</h2>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">MEDBRIDGE AI-Vision Node · Online</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {isSpeaking && <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-600/10 px-2 py-1 rounded-full"><Volume2 className="w-3 h-3 animate-pulse" /> Transmitting</div>}
          <button onClick={() => navigate(`/checkin/${appointmentId}/complete`)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
            <SkipForward className="w-3.5 h-3.5" /> Skip
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-zinc-900/40 backdrop-blur-md px-4 py-3 border-b border-white/[0.02] z-10">
        <div className="flex gap-2 max-w-2xl mx-auto">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= exchangeCount ? "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "bg-white/[0.05]"}`} />
          ))}
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 text-center mt-3">
          {exchangeCount < 3 ? `Phase ${exchangeCount + 1} / 3 Data Acquisition` : "Synthesis Ready"}
        </p>
      </div>

      {/* Chat */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-2xl mx-auto w-full z-10 scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-8 h-8 bg-white/[0.05] border border-red-600/20 rounded-xl flex items-center justify-center text-red-500 text-[10px] font-black uppercase mr-3 flex-shrink-0 mt-1">A</div>
              )}
              <div className={`max-w-sm px-5 py-4 rounded-2xl text-[13px] font-medium leading-relaxed tracking-wide
                ${msg.role === "ai" ? "bg-white/[0.03] border border-white/[0.08] text-zinc-200 rounded-tl-sm shadow-xl" : "bg-primary text-white rounded-tr-sm shadow-[0_0_20px_rgba(249,115,22,0.2)]"}`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {(loading || generating) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="w-8 h-8 bg-white/[0.05] border border-red-600/20 rounded-xl flex items-center justify-center text-red-500 text-[10px] font-black uppercase mr-3 mt-1">A</div>
            <div className="bg-white/[0.02] border border-white/[0.05] px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin text-red-500" /><span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Synthesizing...</span></>
                : <div className="flex gap-1.5">{[0, 150, 300].map(d => <div key={d} className="w-1.5 h-1.5 bg-red-600/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
              }
            </div>
          </motion.div>
        )}

        {transcript && (
          <div className="flex justify-end">
            <div className="max-w-sm px-5 py-4 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-zinc-400 text-xs italic">Intercepting: "{transcript}…"</div>
          </div>
        )}

        {/* Summary result */}
        {summary && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-4 space-y-4">
            <div className={`rounded-2xl p-5 border backdrop-blur-md ${riskColors[summary.riskLevel] || riskColors.MEDIUM}`}>
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-5 h-5 flex-shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Risk Classification: {summary.riskLevel}</span>
                <span className="ml-auto text-[10px] bg-black/20 px-2 py-1 rounded font-black tracking-widest">{(summary.riskScore * 100).toFixed(0)}% CONFIDENCE</span>
              </div>
              <p className="text-[11px] leading-relaxed font-medium opacity-90">{summary.summary}</p>
              {summary.criticalFlags?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-current/20 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[10px] font-black tracking-widest uppercase truncate">{summary.criticalFlags[0]}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(`/checkin/${appointmentId}/complete`)}
              className="w-full py-5 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 group"
            >
              <CheckCircle className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" /> Confirm & Transmit
            </button>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      {!summary && (
        <div className="bg-zinc-900/80 backdrop-blur-3xl border-t border-white/[0.05] px-4 py-5 w-full z-20">
          <div className="max-w-2xl mx-auto space-y-4">
            {micBlocked && <MicBlockedBanner onRetry={askForMicPermission} />}

            {/* Input row */}
            <div className="flex items-center gap-3">
              <input
                ref={textRef}
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendText()}
                placeholder={micBlocked ? "Manual entry required..." : "Type input..."}
                className="flex-1 px-5 py-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm font-medium focus:outline-none focus:border-red-600/50 placeholder:text-zinc-600 transition-colors"
              />
              <button 
                onClick={sendText} 
                disabled={!textInput.trim()} 
                className="p-4 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl disabled:opacity-30 hover:bg-white/10 transition-colors active:scale-95 flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Mic control */}
            <div className="flex items-center justify-between pt-2">
              <motion.button
                onClick={isListening ? stopListening : startListening}
                disabled={loading || isSpeaking || generating || requestingMic}
                className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all disabled:opacity-40 border
                  ${isListening ? "bg-red-500/20 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]" 
                  : micBlocked ? "bg-white/[0.02] border-white/[0.05]" 
                  : "bg-red-600/20 border-red-600/50 shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:bg-red-600/30"}`}
                whileTap={{ scale: 0.9 }}
              >
                {isListening && <div className="absolute inset-0 rounded-full border border-red-400 animate-ping opacity-40" />}
                {requestingMic
                  ? <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                  : isListening
                    ? <MicOff className="w-6 h-6 text-red-400 relative z-10" />
                    : micBlocked
                      ? <MicOff className="w-6 h-6 text-zinc-600" />
                      : <Mic className="w-6 h-6 text-red-500" />
                }
              </motion.button>

              <div className="flex flex-col items-end gap-2">
                {exchangeCount >= 1 && !generating && !summary && (
                  <button
                    onClick={generateSummary}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border border-white/[0.08] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/[0.08] transition-colors active:scale-95"
                  >
                    <Activity className="w-3.5 h-3.5" /> Force Synthesis
                  </button>
                )}
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  {requestingMic ? "Awaiting Auth"
                    : isListening ? "Receiving Data"
                    : micBlocked ? "Mic Disabled"
                    : micPermission === "unknown" ? "Initialize Voice"
                    : "Tap to Speak"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
