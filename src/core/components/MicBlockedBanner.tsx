import { MicOff, ExternalLink, RefreshCw } from "lucide-react";

interface Props {
  onRetry: () => void;
}

function getBrowserHint(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg"))
    return "Click the 🔒 padlock icon in the address bar → Site settings → Microphone → Allow.";
  if (ua.includes("Firefox"))
    return "Click the 🔒 padlock icon in the address bar → Connection Secure → More Information → Permissions → Microphone → Allow.";
  if (ua.includes("Safari") && !ua.includes("Chrome"))
    return "Open Safari Preferences → Websites → Microphone → allow for this site.";
  if (ua.includes("Edg"))
    return "Click the 🔒 padlock in the address bar → Permissions for this site → Microphone → Allow.";
  return "Open your browser's site settings and allow microphone access for this page.";
}

export function MicBlockedBanner({ onRetry }: Props) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
      <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
        <MicOff className="w-5 h-5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 mb-1">Microphone access blocked</p>
        <p className="text-xs text-amber-700 leading-relaxed mb-3">{getBrowserHint()}</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
          <span className="text-xs text-amber-600 self-center">or use the text box below ↓</span>
        </div>
      </div>
    </div>
  );
}
