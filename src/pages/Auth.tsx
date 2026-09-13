import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Brain,
  Sparkles,
  Lock,
  Mail,
  User,
  GraduationCap,
  Calendar,
  Eye,
  EyeOff,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Radio,
} from "lucide-react";
import { loginUser, registerUser } from "@/services/api";
import { isAuthenticated, setAuthToken } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

const EDUCATION_OPTIONS = [
  "High School / Secondary (Grade 9-12)",
  "Undergraduate / Bachelor's (B.Tech, B.Sc, B.Com, B.A)",
  "Graduate / Master's (M.Tech, M.Sc, MBA, M.A)",
  "Doctorate / PhD / Academic Researcher",
  "Working Professional / Industry Specialist",
  "Self-Taught Learner / Tech Bootcamp",
  "Lifelong Learner / General Enthusiast",
];

const PRIMARY_GOALS = [
  { value: "all", label: "Multi-Domain Exploration (Education, Finance, Health, Cooking)" },
  { value: "education", label: "Academic Concepts, STEM & Formative Quizzes" },
  { value: "finance", label: "Financial Analysis, Budgeting & Compound Projections" },
  { value: "cooking", label: "Structured Recipes, Timers & Macro Nutrition" },
  { value: "health", label: "Health Education, Symptom Timelines & Safety" },
];

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [education, setEducation] = useState(EDUCATION_OPTIONS[1]);
  const [primaryGoal, setPrimaryGoal] = useState(PRIMARY_GOALS[0].value);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  if (isAuthenticated()) {
    return <Navigate to="/chat" replace />;
  }

  const numericAge = Number(age);
  const getAgeCategory = (a: number) => {
    if (!a || a <= 0) return null;
    if (a <= 17) return { label: "Young Scholar", color: "border-sky-500 text-sky-400 bg-sky-500/10" };
    if (a <= 24) return { label: "College & Early Career", color: "border-primary text-primary bg-primary/10" };
    if (a <= 45) return { label: "Professional & Wealth Building", color: "border-indigo-400 text-indigo-300 bg-indigo-500/10" };
    return { label: "Senior Specialist & Lifelong Learner", color: "border-purple-400 text-purple-300 bg-purple-500/10" };
  };

  const ageCategory = getAgeCategory(numericAge);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      if (mode === "register") {
        if (!name.trim()) throw new Error("Please enter your full name.");
        if (!Number.isFinite(numericAge) || numericAge < 1 || numericAge > 120) {
          throw new Error("Please provide a valid age between 1 and 120.");
        }
        if (!education) throw new Error("Please select your education level.");
        if (!email.trim() || !email.includes("@")) throw new Error("Please enter a valid email address.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters long.");

        await registerUser({
          name: name.trim(),
          age: numericAge,
          education: education,
          email: email.trim().toLowerCase(),
          password,
        });

        setInfo("🎉 Account successfully registered! Please sign in with your credentials.");
        setMode("login");
        setPassword("");
      } else {
        if (!email.trim()) throw new Error("Please enter your email.");
        if (!password) throw new Error("Please enter your password.");

        const auth = await loginUser({ email: email.trim().toLowerCase(), password });
        setAuthToken(auth.access_token);
        navigate("/chat", { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 flex items-center justify-center">
      <div className="container max-w-5xl mx-auto">
        <div className="glass-strong rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-2xl border border-white/10">
          
          {/* Form Column */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            
            {/* Mode Toggle Tabs */}
            <div className="flex p-1 rounded-xl bg-secondary/60 border border-white/5 mb-6 max-w-xs">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === "login"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === "register"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {mode === "login" ? "Welcome back" : "Join NexusAI Network"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {mode === "login"
                  ? "Access your specialized multi-domain voice assistants and persistent chat sessions."
                  : "Personalize your AI assistants with tailored education levels and adaptive difficulty."}
              </p>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/15 border border-destructive/30 flex items-start gap-2.5 text-xs text-destructive-foreground animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {info && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{info}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" /> Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl bg-secondary/40 px-3.5 py-2.5 text-sm border border-border/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>

                  {/* Age & Age Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> Age
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        required
                        placeholder="e.g. 21"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full rounded-xl bg-secondary/40 px-3.5 py-2.5 text-sm border border-border/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 flex flex-col justify-end">
                      <span className="text-[11px] text-muted-foreground">Demographic Category</span>
                      <div className="h-[42px] flex items-center">
                        {ageCategory ? (
                          <Badge variant="outline" className={`text-xs px-2.5 py-1 ${ageCategory.color}`}>
                            {ageCategory.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">Enter age to categorize</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Education Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-primary" /> Education Level
                    </label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full rounded-xl bg-secondary/60 px-3.5 py-2.5 text-sm border border-border/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground cursor-pointer"
                    >
                      {EDUCATION_OPTIONS.map((opt, i) => (
                        <option key={i} value={opt} className="bg-card text-foreground">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Primary Goal Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-accent" /> Primary Area of Interest
                    </label>
                    <select
                      value={primaryGoal}
                      onChange={(e) => setPrimaryGoal(e.target.value)}
                      className="w-full rounded-xl bg-secondary/60 px-3.5 py-2.5 text-sm border border-border/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-foreground cursor-pointer"
                    >
                      {PRIMARY_GOALS.map((g) => (
                        <option key={g.value} value={g.value} className="bg-card text-foreground">
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-secondary/40 px-3.5 py-2.5 text-sm border border-border/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-secondary/40 pl-3.5 pr-10 py-2.5 text-sm border border-border/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 glow-sm mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4 animate-spin text-primary-foreground" />
                    Connecting...
                  </span>
                ) : mode === "login" ? (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Complete Registration <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right AI Voice Aura Banner */}
          <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-indigo-950/40 via-card/80 to-cyan-950/30 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

            <div>
              <div className="inline-flex items-center gap-2.5 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-voice flex items-center justify-center shadow-lg shadow-cyan-500/20 animate-pulse-glow">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    <span className="text-primary">Nexus</span>AI
                  </h2>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    Multi-Domain Voice Network
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-muted-foreground">
                <div className="p-3.5 rounded-2xl bg-card/60 border border-white/5 space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Specialized Pipelines
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Dedicated architectures for Finance analysis, Recipe & macro calculation, Adaptive Education, and Healthcare safety gating.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-card/60 border border-white/5 space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                    <GraduationCap className="w-3.5 h-3.5 text-accent" /> Per-User Learning Mastery
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Your profile and quiz performance dynamically shape the explanation depth and difficulty.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
              <Link to="/" className="text-primary hover:underline flex items-center gap-1">
                ← Return to Home
              </Link>
              <span className="font-mono text-[10px]">v1.2.0 • FastAPI + Groq</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
