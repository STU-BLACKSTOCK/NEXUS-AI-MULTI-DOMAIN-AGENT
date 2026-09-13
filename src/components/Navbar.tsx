import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brain, Menu, X, User, LogOut, Radio, Sparkles } from "lucide-react";
import { useState } from "react";
import { isAuthenticated, clearAuthToken } from "@/lib/auth";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/chat", label: "Voice Assistant" },
  { path: "/profile", label: "Profile" },
  { path: "/about", label: "About" },
  { path: "/future-scope", label: "Future Scope" },
  { path: "/contact", label: "Contact" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const authed = isAuthenticated();

  const handleLogout = () => {
    clearAuthToken();
    navigate("/auth", { replace: true });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/10">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Glowing AI Voice Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-voice flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:glow transition-all">
            <Brain className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight">
              <span className="gradient-text">Nexus</span>
              <span className="text-foreground">AI</span>
            </span>
            <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Multi-Domain Voice
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1.5 bg-secondary/40 p-1 rounded-2xl border border-white/5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md glow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Auth CTA & Actions */}
        <div className="hidden md:flex items-center gap-2">
          {authed ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary border border-white/10 text-xs font-medium text-foreground transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <User className="w-3 h-3" />
                </div>
                <span>Account</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-500/20"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold glow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Sign In
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-white/10 animate-fade-in">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10 mt-1">
              {authed ? (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Sign In / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

