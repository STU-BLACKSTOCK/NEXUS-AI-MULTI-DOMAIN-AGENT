import { GraduationCap, DollarSign, HeartPulse, ChefHat, Layers, Sparkles, Activity } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { Badge } from "@/components/ui/badge";

const DOMAIN_CONFIGS = [
  {
    mode: "integrated" as const,
    label: "Integrated Orchestrator",
    subtitle: "Auto Intent Routing & Chaining",
    icon: Layers,
    color: "text-cyan-400",
    activeClass: "bg-cyan-950/30 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10",
    badge: "Multi-Agent",
  },
  {
    mode: "education" as const,
    label: "Education Assistant",
    subtitle: "Adaptive Mastery, Diagrams & Quizzes",
    icon: GraduationCap,
    color: "text-indigo-400",
    activeClass: "bg-indigo-950/30 text-indigo-300 border-indigo-500/40 shadow-indigo-500/10",
    badge: "Mastery Model",
  },
  {
    mode: "finance" as const,
    label: "Finance Assistant",
    subtitle: "Analysis Engine & Python Math",
    icon: DollarSign,
    color: "text-emerald-400",
    activeClass: "bg-emerald-950/30 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10",
    badge: "Pure Math",
  },
  {
    mode: "healthcare" as const,
    label: "Healthcare Assistant",
    subtitle: "Clinical Triage & Red-Flag Gate",
    icon: HeartPulse,
    color: "text-teal-400",
    activeClass: "bg-teal-950/30 text-teal-300 border-teal-500/40 shadow-teal-500/10",
    badge: "Safety Gate",
  },
  {
    mode: "cooking" as const,
    label: "Cooking Assistant",
    subtitle: "Structured Recipes, Timers & Macros",
    icon: ChefHat,
    color: "text-amber-400",
    activeClass: "bg-amber-950/30 text-amber-300 border-amber-500/40 shadow-amber-500/10",
    badge: "100+ Food DB",
  },
];

export default function DomainSidebar() {
  const { assistantMode, setAssistantMode } = useChat();

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="glass-strong rounded-2xl p-4 border border-white/10 shadow-xl h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 px-1 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Domain Pipelines</h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">5 Active</span>
          </div>

          <div className="flex flex-col gap-2">
            {DOMAIN_CONFIGS.map((cfg) => {
              const Icon = cfg.icon;
              const isActive = assistantMode === cfg.mode;

              return (
                <button
                  key={cfg.mode}
                  type="button"
                  onClick={() => setAssistantMode(cfg.mode)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left border transition-all relative overflow-hidden group ${
                    isActive
                      ? `${cfg.activeClass} shadow-md border-2`
                      : "border-white/5 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:border-white/10"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? "bg-white/10" : "bg-secondary/70"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-foreground truncate">{cfg.label}</span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse shadow-sm" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{cfg.subtitle}</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/5">
                        {cfg.badge}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 px-1">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary leading-relaxed flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>AI Voice & Structured Response Pipeline v1.2</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

