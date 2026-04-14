export type MicPermission = "unknown" | "granted" | "denied" | "unsupported";

// Extend global Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Define basic interfaces
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export class VoiceAgent {
  private recognition: any = null;
  private synthesis = window.speechSynthesis;
  private isListening = false;
  private isSpeaking = false;
  private micStream: MediaStream | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentLanguage = "en-IN";

  constructor() {
    // Crucial for Chrome: voices are loaded asynchronously
    this.synthesis.onvoiceschanged = () => {
      this.voices = this.synthesis.getVoices();
    };
    this.voices = this.synthesis.getVoices();
  }

  isAvailable(): boolean {
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  setLanguage(lang: string): void {
    this.currentLanguage = lang;
  }

  /**
   * Explicitly request microphone permission via getUserMedia.
   * Returns "granted", "denied", or "unsupported".
   * Must be called from a user-gesture handler (click, etc.).
   */
  async requestMicPermission(): Promise<MicPermission> {
    if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
    try {
      // Stop any previous stream first
      this.micStream?.getTracks().forEach(t => t.stop());
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Keep the stream alive so the browser doesn't re-prompt
      return "granted";
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") return "denied";
      if (name === "NotFoundError" || name === "DevicesNotFoundError") return "unsupported";
      return "denied";
    }
  }

  /** Query the current mic permission state without prompting. */
  async checkMicPermission(): Promise<MicPermission> {
    if (!navigator.permissions) return "unknown";
    try {
      const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
      if (status.state === "granted") return "granted";
      if (status.state === "denied") return "denied";
      return "unknown";
    } catch {
      return "unknown";
    }
  }

  startListening(
    onInterim: (text: string) => void,
    onFinal: (text: string) => void,
    onEnd: () => void,
    onError: (error: string) => void
  ): void {
    if (this.isSpeaking) return;
    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { onError("not-supported"); return; }

    // Always stop previous if any
    this.stopListening();

    this.recognition = new SR();
    this.recognition.continuous = false; // We use per-phrase for chat
    this.recognition.interimResults = true;
    this.recognition.lang = this.currentLanguage;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => { this.isListening = true; };
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      if (interim) onInterim(interim);
      if (final.trim()) onFinal(final);
    };
    this.recognition.onend = () => { this.isListening = false; onEnd(); };
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      if (event.error !== "aborted") onError(event.error);
    };

    try { this.recognition.start(); } catch (e) { onError(String(e)); }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
        this.recognition.abort(); // Force kill
      } catch (e) {}
      this.recognition = null;
      this.isListening = false;
    }
  }

  /** Release the mic stream (call on component unmount). */
  releaseMic(): void {
    this.micStream?.getTracks().forEach(t => t.stop());
    this.micStream = null;
  }

  speak(text: string, onEnd?: () => void): void {
    // Chrome bug: synthesis can get stuck in paused state.
    this.synthesis.resume();
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = this.currentLanguage;

    // Ensure voices are loaded
    if (this.voices.length === 0) this.voices = this.synthesis.getVoices();

    const langLower = this.currentLanguage.toLowerCase();
    const langCode = langLower.split("-")[0];

    // Priority based selection
    let preferredVoice =
      // 1. Exact lang match + preferred keywords (female/woman/assistant)
      this.voices.find(v => v.lang.toLowerCase() === langLower && 
        (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("woman") || v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("zira"))) ||
      // 2. Exact lang match (any)
      this.voices.find(v => v.lang.toLowerCase() === langLower) ||
      // 3. Lang code match (ta, hi, te) + female keywords
      this.voices.find(v => v.lang.toLowerCase().startsWith(langCode) && 
        (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("woman"))) ||
      // 4. Lang code match (any)
      this.voices.find(v => v.lang.toLowerCase().startsWith(langCode)) ||
      // 5. Native names (e.g. Valluvar for Tamil, Kalpana for Hindi)
      this.voices.find(v => v.name.toLowerCase().includes("valluvar") || v.name.toLowerCase().includes("kalpana") || v.name.toLowerCase().includes("vani") || v.name.toLowerCase().includes("sangeeta")) ||
      // 6. Any Indian regional voice as a desperate fallback
      this.voices.find(v => v.lang.toLowerCase().includes("-in"));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    } else {
      // Fallback to system default if nothing found, but keep the lang tag
      utterance.lang = this.currentLanguage;
    }

    this.isSpeaking = true;
    utterance.onend = () => { 
      this.isSpeaking = false; 
      onEnd?.(); 
    };
    utterance.onerror = (e) => { 
      console.error("Speech Synthesis Error:", e);
      this.isSpeaking = false; 
      onEnd?.(); 
    };

    this.synthesis.speak(utterance);
  }

  stopSpeaking(): void {
    this.synthesis.cancel();
    this.isSpeaking = false;
  }

  get listening() { return this.isListening; }
  get speaking() { return this.isSpeaking; }
}

export function getRiskColor(level: string | null): string {
  switch (level) {
    case "HIGH": return "text-red-600";
    case "MEDIUM": return "text-amber-600";
    case "LOW": return "text-green-600";
    default: return "text-gray-500";
  }
}

export function getRiskBg(level: string | null): string {
  switch (level) {
    case "HIGH": return "bg-red-100 text-red-700 border-red-300";
    case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-300";
    case "LOW": return "bg-green-100 text-green-700 border-green-300";
    default: return "bg-gray-100 text-gray-600 border-gray-300";
  }
}

export function getRiskDot(level: string | null): string {
  switch (level) {
    case "HIGH": return "bg-red-500";
    case "MEDIUM": return "bg-amber-500";
    case "LOW": return "bg-green-500";
    default: return "bg-gray-400";
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function getAge(dob: string): number {
  if (!dob) return 0;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
