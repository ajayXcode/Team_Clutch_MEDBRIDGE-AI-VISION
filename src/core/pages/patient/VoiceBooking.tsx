import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { mockApi } from "../../lib/mockData";
import { VoiceAgent, MicPermission, formatTime } from "../../lib/voice";
import { MicBlockedBanner } from "../../components/MicBlockedBanner";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Mic, MicOff, ArrowLeft, Loader2, Volume2, Send, Bot } from "lucide-react";
import { toast } from "sonner";

interface Message { role: "ai" | "user"; text: string; }
interface Doctor { id: string; name: string; specialty: string; slots: string[]; }

const TRANSLATIONS: Record<string, any> = {
  "en-IN": {
    label: "English",
    initial: "Hi! I'm MEDBRIDGE AI-Vision, your AI booking assistant. Which doctor or specialty would you like to book with?",
    confirm: (doc: string, time: string) => `I have ${doc} available at ${time}. Shall I go ahead and book this for you?`,
    success: (doc: string, date: string, time: string) => `Perfect! Your appointment with ${doc} is confirmed for ${date} at ${time}. Would you like to start your symptom check-in now?`,
    slots: (doc: string, slots: string) => `Great, ${doc}. Their available slots are: ${slots}. What time works for you?`,
    fallback: (docs: string) => `I couldn't quite catch the doctor or specialty you're looking for. We have doctors like ${docs}. Who would you like to see?`,
    hello: "Hello! Who would you like to book an appointment with?",
    error: "I'm having trouble connecting. Please try again or use manual booking.",
    yes: ["yes", "confirm", "sure", "ok", "book", "yeah", "yup"],
    no: ["no", "later", "dashboard", "back", "cancel"]
  },
  "hi-IN": {
    label: "हिंदी",
    initial: "नमस्ते! मैं आरोही हूँ, आपकी डिजिटल बुकिंग सहायक। आप किस डॉक्टर या विशेषज्ञ के साथ संपर्क करना चाहेंगे?",
    confirm: (doc: string, time: string) => `मेरे पास ${time} बजे ${doc} उपलब्ध हैं। क्या मैं इसे आपके लिए बुक कर दूँ?`,
    success: (doc: string, date: string, time: string) => `बहुत बढ़िया! ${doc} के साथ आपका अपॉइंटमेंट ${date} को ${time} पर पक्का हो गया है। क्या आप अभी चेक-इन करना चाहेंगे?`,
    slots: (doc: string, slots: string) => `ठीक है, ${doc}। उनके उपलब्ध समय हैं: ${slots}। आपके लिए कौन सा समय सही रहेगा?`,
    fallback: (docs: string) => `मैं समझ नहीं पाई। हमारे पास ${docs} जैसे डॉक्टर उपलब्ध हैं। आप किसे दिखाना चाहेंगे?`,
    hello: "नमस्ते! आप किसके साथ अपॉइंटमेंट बुक करना चाहेंगे?",
    error: "कनेक्ट करने में समस्या हो रही है। कृपया पुनः प्रयास करें।",
    yes: ["हां", "जी", "कन्फर्म", "बुक", "ठीक है", "जरूर", "हाजी"],
    no: ["नहीं", "बाद में", "डैशबोर्ड", "रहने दो"]
  },
  "ta-IN": {
    label: "தமிழ்",
    initial: "வணக்கம்! நான் ஆரூகி, உங்கள் முன்பதிவு உதவியாளர். எந்த மருத்துவரிடம் முன்பதிவு செய்ய விரும்புகிறீர்கள்?",
    confirm: (doc: string, time: string) => `என்னிடம் ${time} மணிக்கு ${doc} உள்ளனர். நான் இதை முன்பதிவு செய்யவா?`,
    success: (doc: string, date: string, time: string) => `அற்புதம்! ${doc} உடனான உங்கள் அப்பாயிண்ட்மெண்ட் ${date} அன்று ${time} மணிக்கு உறுதிசெய்யப்பட்டது. இப்போது சோதனையைத் தொடங்கலாமா?`,
    slots: (doc: string, slots: string) => `நல்லது, ${doc}. அவர்கள் இருக்கும் நேரங்கள்: ${slots}. உங்களுக்கு எந்த நேரம் வசதி?`,
    fallback: (docs: string) => `மன்னிக்கவும், புரியவில்லை. எங்களிடம் ${docs} போன்ற மருத்துவர்கள் உள்ளனர். யாரைப் பார்க்க வேண்டும்?`,
    hello: "வணக்கம்! யாருடன் முன்பதிவு செய்ய விரும்புகிறீர்கள்?",
    error: "இணைப்பதில் சிக்கல் உள்ளது. மீண்டும் முயற்சிக்கவும்.",
    yes: ["ஆமாம்", "சரி", "உறுதி", "புக்", "கண்டிப்பா"],
    no: ["இல்லை", "வேண்டாம்", "அப்புறம்", "ரத்து"]
  },
  "te-IN": {
    label: "తెలుగు",
    initial: "నమస్తే! నేను ఆరోహిని, మీ బుకింగ్ అసిస్టెంట్ని. మీరు ఏ డాక్టర్ ని కలవాలనుకుంటున్నారు?",
    confirm: (doc: string, time: string) => `నా దగ్గర ${time} గంటలకు ${doc} అందుబాటులో ఉన్నారు. నేను బుక్ చేయాలా?`,
    success: (doc: string, date: string, time: string) => `అద్భుతం! ${doc} తో మీ అపాయింట్‌మెంట్ ${date} న ${time} గంటలకు ఖరారైంది. ఇప్పుడు తనిఖీని ప్రారంభిద్దామా?`,
    slots: (doc: string, slots: string) => `సరే, ${doc}. వారు అందుబాటులో ఉన్న సమయాలు: ${slots}. మీకు ఏ సమయం బాగుంటుంది?`,
    fallback: (docs: string) => `క్షమించండి, అర్థం కాలేదు. మా దగ్గర ${docs} వంటి వైద్యులు ఉన్నారు. మీరు ఎవరిని చూడాలనుకుంటున్నారు?`,
    hello: "నమస్తే! మీరు ఎవరితో అపాయింట్‌మెంట్ బుక్ చేయాలనుకుంటున్నారు?",
    error: "కనెక్ట్ చేయడంలో ఇబ్బంది ఉంది. మళ్ళీ ప్రయత్నించండి.",
    yes: ["అవును", "సరే", "ఖరారు", "బుక్", "తప్పకుండా", "హా"],
    no: ["వద్దు", "తర్వాత", "కాదు", "రద్దు"]
  }
};

const agent = new VoiceAgent();

export default function VoiceBooking() {
  const navigate = useNavigate();
  const { user, activePatient } = useAuth();
  const [currentLang, setCurrentLang] = useState("en-IN");
  const t = TRANSLATIONS[currentLang];
  
  const [messages, setMessages] = useState<Message[]>([{ role: "ai", text: t.initial }]);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookingState, setBookingState] = useState<{ doctorId?: string; slot?: string; date?: string }>({});
  const [textInput, setTextInput] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<MicPermission>("unknown");
  const [requestingMic, setRequestingMic] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) navigate("/patient/login");
    const docs = mockApi.getDoctors();
    setDoctors(docs);
  }, [user, navigate]);

  useEffect(() => {
    agent.setLanguage(currentLang);
    let timer: any;
    agent.checkMicPermission().then(p => {
      setMicPermission(p);
      timer = setTimeout(() => {
        setMessages([{ role: "ai", text: t.initial }]);
        agent.speak(t.initial, () => setIsSpeaking(false));
        setIsSpeaking(true);
      }, 500);
    });

    return () => { 
      if (timer) clearTimeout(timer);
      agent.stopListening(); 
      agent.stopSpeaking(); 
      agent.releaseMic(); 
    };
  }, [currentLang, t.initial]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (micPermission === "denied") textRef.current?.focus();
  }, [micPermission]);

  const addMessage = (role: "ai" | "user", text: string) =>
    setMessages(prev => [...prev, { role, text }]);

  const askForMicPermission = async () => {
    if (!agent.isAvailable()) {
      setMicPermission("unsupported");
      return;
    }
    setRequestingMic(true);
    const result = await agent.requestMicPermission();
    setMicPermission(result);
    setRequestingMic(false);
    if (result === "granted") {
      beginListening();
    } else if (result === "denied") {
      textRef.current?.focus();
    }
  };

  const beginListening = () => {
    agent.stopSpeaking(); setIsSpeaking(false);
    setIsListening(true);
    agent.startListening(
      i => setTranscript(i),
      f => { 
        if (f.trim()) {
          setTranscript(""); 
          setIsListening(false); 
          handleUserInput(f); 
        }
      },
      () => setIsListening(false),
      err => {
        setIsListening(false);
        if (err === "not-allowed") {
          setMicPermission("denied");
          textRef.current?.focus();
        } else if (err !== "no-speech" && err !== "aborted") {
          toast.error(`Mic error: ${err}`);
        }
      }
    );
  };

  const startListening = async () => {
    if (!agent.isAvailable()) {
      setMicPermission("unsupported");
      textRef.current?.focus();
      return;
    }
    if (micPermission === "granted") {
      beginListening();
      return;
    }
    await askForMicPermission();
  };

  const stopListening = () => { agent.stopListening(); setIsListening(false); };

  const handleUserInput = async (text: string) => {
    if (!text.trim()) return;
    addMessage("user", text);
    setLoading(true);

    try {
      const lowerText = text.toLowerCase();
      
      let doctorMatch = doctors.find(d =>
        lowerText.includes(d.name.toLowerCase().split(" ").slice(-1)[0].toLowerCase()) ||
        lowerText.includes(d.name.toLowerCase().split(" ")[0].toLowerCase()) ||
        lowerText.includes(d.name.toLowerCase().replace("dr. ", "")) ||
        lowerText.includes(d.specialty.toLowerCase())
      );
      
      let slotMatch: string | undefined;
      const timeMatch = lowerText.match(/\b(10|11|12|1|2|3|4|9)(?::00)?\s*(a\.?m\.?|p\.?m\.?)?\b/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const period = timeMatch[2]?.toLowerCase().replace(/\./g, "");
        if (period === "pm" && hour < 12) hour += 12;
        if (period === "am" && hour === 12) hour = 0;
        if (!period && hour >= 1 && hour <= 5) hour += 12;
        slotMatch = `${hour.toString().padStart(2, "0")}:00`;
      }

      let date = bookingState.date;
      if (!date) {
        const today = new Date();
        if (lowerText.includes("friday")) { const d = (5 - today.getDay() + 7) % 7 || 7; today.setDate(today.getDate() + d); }
        else if (lowerText.includes("tomorrow")) today.setDate(today.getDate() + 1);
        else if (lowerText.includes("monday")) { const d = (1 - today.getDay() + 7) % 7 || 7; today.setDate(today.getDate() + d); }
        else today.setDate(today.getDate() + 1);
        date = today.toISOString().split("T")[0];
      }

      const newState = { doctorId: doctorMatch?.id || bookingState.doctorId, slot: slotMatch || bookingState.slot, date: date || bookingState.date };
      setBookingState(newState);

      if (confirmed) {
        const isYes = t.yes.some((y: string) => lowerText.includes(y)) || lowerText.includes("check") || lowerText.includes("symptom");
        const isNo = t.no.some((n: string) => lowerText.includes(n));
        
        if (isYes) {
          navigate(`/checkin/${appointmentId}`); return;
        }
        if (isNo) {
          navigate("/patient/dashboard"); return;
        }
      }

      const selectedDoctor = doctors.find(d => d.id === newState.doctorId);

      if (newState.doctorId && newState.slot) {
        if (selectedDoctor && !confirmed) {
          const isAffirmative = t.yes.some((y: string) => lowerText.includes(y));
          if (isAffirmative) {
            const appt = mockApi.bookAppointment({
              patientId: activePatient?.id || "demo-p-001", 
              doctorId: newState.doctorId,
              date: newState.date, slot: newState.slot, reason: "Voice booking"
            });
            setAppointmentId(appt.id); setConfirmed(true);
            const dateStr = new Date(newState.date!).toLocaleDateString(currentLang, { weekday: "long", day: "numeric" });
            const confirmMsg = t.success(selectedDoctor.name, dateStr, formatTime(newState.slot!));
            addMessage("ai", confirmMsg);
            agent.speak(confirmMsg, () => setIsSpeaking(false)); setIsSpeaking(true);
            setLoading(false); return;
          } else {
            const confirmMsg = t.confirm(selectedDoctor.name, formatTime(newState.slot!));
            addMessage("ai", confirmMsg);
            agent.speak(confirmMsg, () => setIsSpeaking(false)); setIsSpeaking(true);
            setLoading(false); return;
          }
        }
      } else if (newState.doctorId && !newState.slot) {
        if (selectedDoctor) {
          const slotsMsg = t.slots(selectedDoctor.name, selectedDoctor.slots.map(formatTime).join(", "));
          addMessage("ai", slotsMsg);
          agent.speak(slotsMsg, () => setIsSpeaking(false)); setIsSpeaking(true);
          setLoading(false); return;
        }
      } else {
        if (lowerText.includes("hi") || lowerText.includes("hello") || lowerText.includes("नमस्ते") || lowerText.includes("வணக்கம்")) {
          const res = t.hello;
          addMessage("ai", res);
          agent.speak(res, () => setIsSpeaking(false)); setIsSpeaking(true);
          setLoading(false); return;
        }

        const fallback = t.fallback(doctors.slice(0, 2).map(d => `${d.name} (${d.specialty})`).join(" and "));
        addMessage("ai", fallback);
        agent.speak(fallback, () => setIsSpeaking(false)); setIsSpeaking(true);
      }
    } catch (e: any) {
      const fallback = t.error;
      addMessage("ai", fallback);
      agent.speak(fallback, () => setIsSpeaking(false)); setIsSpeaking(true);
    } finally { setLoading(false); }
  };

  const sendText = () => { if (textInput.trim()) { handleUserInput(textInput); setTextInput(""); } };

  const micBlocked = micPermission === "denied" || micPermission === "unsupported";

  return (
    <div className="min-h-screen bg-black flex flex-col selection:bg-primary/30 text-white">
      {/* Header */}
      <div className="bg-zinc-900/40 backdrop-blur-3xl border-b border-white/[0.05] px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-lg">
        <button onClick={() => navigate("/patient/dashboard")} title="Back to Dashboard" className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center border border-red-600/20 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
          <Bot className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="font-black text-white text-lg tracking-tight uppercase">Voice Booking Terminal</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">MEDBRIDGE AI-Vision — Autonomous Agent</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex bg-white/[0.03] border border-white/[0.1] rounded-xl p-1">
            {Object.entries(TRANSLATIONS).map(([code, data]) => (
              <button
                key={code}
                onClick={() => setCurrentLang(code)}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${currentLang === code ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-zinc-500 hover:text-white"}`}
              >
                {data.label}
              </button>
            ))}
          </div>
          {isSpeaking && <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-red-500 animate-pulse"><Volume2 className="w-4 h-4" /> Synthesizing</div>}
          <button onClick={() => navigate("/book/manual")} className="text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-lg hover:bg-white/5">Manual Mode</button>
        </div>
      </div>

      {/* Chat */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-6 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-8 h-8 bg-red-600/10 border border-red-600/30 rounded-xl flex items-center justify-center text-red-500 mr-3 flex-shrink-0 mt-1 shadow-[0_0_10px_rgba(220,38,38,0.1)]">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`max-w-lg px-6 py-4 rounded-3xl text-sm leading-relaxed shadow-xl font-medium tracking-wide ${msg.role === "ai" ? "bg-white/[0.03] border border-white/[0.08] text-zinc-300 rounded-tl-sm" : "bg-primary text-white shadow-primary/20 rounded-tr-sm"}`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="w-8 h-8 bg-red-600/10 border border-red-600/30 rounded-xl flex items-center justify-center text-red-500 mr-3 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] px-6 py-4 rounded-3xl rounded-tl-sm flex items-center">
              <div className="flex gap-1.5">
                {[0, 150, 300].map(d => <div key={d} className={`w-2 h-2 bg-red-500 rounded-full animate-bounce ${d === 150 ? "delay-150" : d === 300 ? "delay-300" : ""}`} />)}
              </div>
            </div>
          </motion.div>
        )}
        {transcript && (
          <div className="flex justify-end">
            <div className="max-w-sm px-6 py-4 rounded-3xl bg-primary/20 border border-primary/30 text-primary-foreground text-sm italic rounded-tr-sm">{transcript}...</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-zinc-900/60 backdrop-blur-[40px] border-t border-white/[0.05] px-6 py-6 pb-8 sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto space-y-5">
          {micBlocked && (
            <MicBlockedBanner onRetry={askForMicPermission} />
          )}

          <div className="flex items-center justify-center mb-4">
            <motion.button
              onClick={isListening ? stopListening : startListening}
              disabled={loading || isSpeaking || requestingMic}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all disabled:opacity-50 overflow-hidden group
                ${isListening ? "bg-red-500 shadow-red-500/30" : micBlocked ? "bg-zinc-800 shadow-none border border-white/10" : "bg-white text-black shadow-white/20 hover:scale-105"}`}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 ${!isListening && !micBlocked && 'group-hover:opacity-100'} transition-opacity`} />
              {isListening && <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40" />}
              {requestingMic
                ? <Loader2 className="w-8 h-8 animate-spin" />
                : isListening
                  ? <MicOff className="w-8 h-8 text-white relative z-10" />
                  : micBlocked
                    ? <MicOff className="w-8 h-8 text-zinc-500" />
                    : <Mic className="w-8 h-8 -mr-1" />
              }
            </motion.button>
          </div>
          
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">
            {requestingMic ? "AWAITING PERMISSIONS..."
              : isListening ? "RECORDING VOCAL INPUT..."
              : isSpeaking ? "AGENT SYNTHESIZING..."
              : micBlocked ? "INPUT BLOCKED — USE OVERRIDE TERMINAL"
              : micPermission === "unknown" ? "ENGAGE MIC TO INITIATE"
              : "READY TO LISTEN"}
          </p>

          <div className="flex items-center gap-3">
            <input
              ref={textRef}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendText()}
              placeholder={micBlocked ? "Manual override active..." : "Type text override..."}
              aria-label="Type your message"
              className="flex-1 px-5 py-4 rounded-2xl border border-white/[0.08] text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white/[0.03] placeholder:text-zinc-600 font-medium"
            />
            <button onClick={sendText} disabled={!textInput.trim()} title="Send message" className="p-4 bg-primary text-white rounded-2xl disabled:opacity-40 hover:bg-orange-600 transition-colors shadow-lg shadow-primary/20 active:scale-95">
              <Send className="w-5 h-5 -ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
