import { BackgroundPaths } from "../components/ui/background-paths";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function DemoBackground() {
    const navigate = useNavigate();

    return (
        <div className="relative">
            <button 
                onClick={() => navigate("/")}
                title="Back to Home"
                className="fixed top-6 left-6 z-50 p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-all"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
            <BackgroundPaths className="!min-h-screen">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Background Paths Demo</h1>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                        A beautiful animated background component using Framer Motion (Motion/React) and SVG paths.
                    </p>
                </div>
            </BackgroundPaths>
        </div>
    );
}
