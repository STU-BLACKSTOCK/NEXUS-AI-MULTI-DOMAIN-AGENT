import React from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  MessageSquare,
  ArrowRight,
  Zap,
  Mic,
  DollarSign,
  GraduationCap,
  HeartPulse,
  ChefHat,
  Layers,
  Sparkles,
  ShieldCheck,
  Activity,
} from "lucide-react";

const domainShowcases = [
  {
    icon: DollarSign,
    name: "Finance Analysis Engine",
    color: "from-emerald-500 to-cyan-500 text-emerald-400 border-emerald-500/30",
    description: "Deterministic Python arithmetic for savings rate, compound growth projections, runway, and debt amortization.",
    pill: "Pure Python Math",
  },
  {
    icon: ChefHat,
    name: "Cooking & Nutrition Pipeline",
    color: "from-amber-500 to-orange-500 text-amber-400 border-amber-500/30",
    description: "Structured recipes with interactive step timers, verified culinary substitutions, and USDA-calibrated nutrition lookup.",
    pill: "100+ Ingredient DB",
  },
  {
    icon: GraduationCap,
    name: "Adaptive Education Assistant",
    color: "from-indigo-500 to-purple-500 text-indigo-400 border-indigo-500/30",
    description: "Dynamic difficulty scaling backed by MongoDB mastery tracking, native Mermaid diagram specs, and client-graded quizzes.",
    pill: "Mastery Model",
  },
  {
    icon: HeartPulse,
    name: "Healthcare Safety Gate",
    color: "from-teal-500 to-emerald-500 text-teal-400 border-teal-500/30",
    description: "Non-overridable deterministic red-flag safety checklist, symptom progression timelines, and clinical guidance.",
    pill: "Clinical Safety Gate",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[90vh] overflow-hidden px-4 py-16 text-center">
        
        {/* Pulsing AI Voice Wave Aura Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-purple-500/10 blur-[130px] pointer-events-none animate-pulse-glow" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/15 blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/30 text-xs font-mono text-primary shadow-lg shadow-cyan-500/10 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>4 Specialized AI Pipelines Live</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            The Next-Gen <br />
            <span className="gradient-text">Multi-Domain AI</span> Voice Assistant
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            Beyond plain text prompts. NexusAI combines deterministic Python calculation engines, static nutrition databases, adaptive mastery models, and clinical safety gating into one unified voice network.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all glow shadow-xl shadow-cyan-500/20"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              Launch Voice Assistant
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl glass text-foreground font-semibold text-sm hover:bg-white/10 transition-all border border-white/10"
            >
              System Architecture
            </Link>
          </div>

          {/* Voice Wave Visualizer Simulation */}
          <div className="pt-10 flex items-center justify-center gap-1.5 opacity-80">
            {[40, 65, 30, 90, 45, 100, 60, 30, 80, 50, 70, 35, 95, 40].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h * 0.4}px`, animationDelay: `${i * 0.1}s` }}
                className="w-1 rounded-full bg-gradient-to-t from-cyan-500 to-indigo-500 animate-pulse"
              />
            ))}
          </div>

        </div>
      </section>

      {/* Specialized Pipelines Section */}
      <section className="py-20 px-4 relative z-10 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Differentiated by <span className="gradient-text">Architecture</span>, Not Just Prompts
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every domain operates with custom backend computational layers and tailored frontend interactive components.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {domainShowcases.map((dom) => {
              const Icon = dom.icon;
              return (
                <div
                  key={dom.name}
                  className="glass-strong rounded-3xl p-7 border border-white/10 hover:border-primary/40 transition-all duration-300 group hover:-translate-y-1 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                      <Icon className={`w-6 h-6 ${dom.color.split(" ")[2]}`} />
                    </div>
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                      {dom.pill}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {dom.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {dom.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
