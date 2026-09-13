import { Brain, Github } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border/30 bg-card/30 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold">
                <span className="text-primary">Nexus</span>AI
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Multi-Domain Voice Assistant Ecosystem — A Specialized Conversational AI Network.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <h4 className="font-medium text-sm text-foreground mb-1">Quick Links</h4>
            {[
              { to: "/", label: "Home" },
              { to: "/chat", label: "Chat Interface" },
              { to: "/about", label: "About Project" },
              { to: "/future-scope", label: "Future Scope" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Developer */}
          <div className="flex flex-col gap-2">
            <h4 className="font-medium text-sm text-foreground mb-1">Developer</h4>
            <p className="text-sm text-muted-foreground">Academic Research Project</p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              aria-label="GitHub repository"
            >
              <Github className="w-4 h-4" />
              GitHub Repository
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NexusAI — Academic Project. For educational and research purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
