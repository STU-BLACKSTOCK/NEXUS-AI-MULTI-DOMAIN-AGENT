import { Rocket, FileSearch, ImagePlus, Smartphone, Plug, Brain, Users } from "lucide-react";

const futureItems = [
  {
    icon: <FileSearch className="w-5 h-5" />,
    title: "Document-grounded answers",
    desc: "Upload PDFs, notes, or syllabi so replies cite your own materials with retrieval-augmented context.",
  },
  {
    icon: <ImagePlus className="w-5 h-5" />,
    title: "Multimodal input",
    desc: "Send photos, diagrams, or handwriting for explanations, recipe ideas, or step-by-step homework help.",
  },
  {
    icon: <Smartphone className="w-5 h-5" />,
    title: "Installable PWA",
    desc: "Add NexusAI to your home screen, faster repeat visits, and optional study or medication reminders.",
  },
  {
    icon: <Plug className="w-5 h-5" />,
    title: "Tool & API plugins",
    desc: "Safe connectors for calendars, weather, finance data, and education APIs without leaving the chat.",
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: "Long-horizon memory",
    desc: "Optional goals and preferences that persist across weeks—study plans, budgets, or wellness routines.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Shared workspaces",
    desc: "Team or classroom threads, roles, and exportable transcripts for review and compliance.",
  },
];

export default function FutureScope() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-4xl animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold">Future Scope</h1>
        </div>
        <p className="text-muted-foreground mb-10 leading-relaxed max-w-2xl">
          Education, finance, healthcare, cooking, integrated routing, and voice mode are live today. Below are
          directions we can grow next—same architecture, richer context and reach.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {futureItems.map((item) => (
            <div key={item.title} className="glass rounded-xl p-6 hover:bg-secondary/60 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:glow-sm transition-shadow">
                {item.icon}
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
