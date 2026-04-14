import { Heart } from "lucide-react";
import { Link } from "react-router";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizes = {
    sm: { container: "w-8 h-8", icon: "w-4 h-4", text: "text-lg", sub: "text-[8px]" },
    md: { container: "w-10 h-10", icon: "w-5 h-5", text: "text-xl", sub: "text-[10px]" },
    lg: { container: "w-12 h-12", icon: "w-6 h-6", text: "text-2xl", sub: "text-[11px]" },
  };

  const current = sizes[size];

  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      <div className={`${current.container} bg-gradient-to-br from-red-600 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-all duration-300 border border-white/10`}>
        <Heart className={`${current.icon} text-white fill-white/20`} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`${current.text} font-black text-white tracking-tighter uppercase leading-none`}>
          MedBridge
        </span>
        <span className={`${current.sub} font-bold text-red-500 tracking-[0.2em] uppercase`}>
          AI-Vision
        </span>
      </div>
    </Link>
  );
}
