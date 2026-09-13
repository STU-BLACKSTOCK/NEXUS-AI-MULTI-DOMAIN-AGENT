import { Brain, Cpu, Route, Database, Layers } from "lucide-react";

const archSteps = [
  {
    icon: <Layers className="w-5 h-5" />,
    title: "Central Orchestrator",
    desc: "Receives all incoming queries, manages context, and coordinates the full response pipeline.",
  },
  {
    icon: <Route className="w-5 h-5" />,
    title: "Intent Router",
    desc: "Analyzes the user’s intent and routes the request to the most appropriate domain assistant.",
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: "Domain Assistants",
    desc: "Specialized modules for education, finance, healthcare, and cooking handle domain-specific reasoning and tone.",
  },
  {
    icon: <Cpu className="w-5 h-5" />,
    title: "Cloud LLM Layer",
    desc: "A managed Groq-backed inference layer powers language understanding, generation, and routing fallback decisions.",
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: "FastAPI Backend",
    desc: "A FastAPI service exposes HTTP endpoints used by the React frontend and continuous voice loop.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-3xl animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">
          About <span className="text-primary">NexusAI</span>
        </h1>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          NexusAI is a multi-domain voice assistant ecosystem. It explores how a central orchestrator, cloud LLM layer, and
          specialized assistants can work together to deliver accurate, contextual responses for different domains.
        </p>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          The current implementation includes education, finance, healthcare, cooking, integrated routing, authentication,
          and a continuous voice interaction loop: the system listens, understands, responds, speaks the answer back, and
          keeps listening until you stop Voice Mode.
        </p>

        <h2 className="text-xl font-semibold mb-6">System Architecture</h2>
        <div className="space-y-3 mb-12">
          {archSteps.map((step, i) => (
            <div key={step.title} className="glass rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  <span className="text-primary font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold mb-2">What NexusAI Demonstrates</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
              <li>How a central orchestrator can route queries to specialized domain assistants.</li>
              <li>How conversation context is managed across turns for more coherent answers.</li>
              <li>How a managed LLM layer can power reliable responses with scalable backend deployment.</li>
              <li>How a continuous voice loop can turn a web app into a hands-free assistant.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Key Capabilities</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
              <li>Four specialized assistants (education, finance, healthcare, cooking) plus integrated auto-routing.</li>
              <li>Voice Mode that listens, processes, and responds with natural speech until you stop it.</li>
              <li>Authentication and user profiles that personalize response style and context handling.</li>
              <li>Clean separation between frontend UI, backend API, orchestration logic, and LLM integration.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
