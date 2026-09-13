import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, GraduationCap, Calendar, ShieldCheck, Sparkles, MessageSquare, LogOut, ArrowRight, Activity } from "lucide-react";
import { clearAuthToken } from "@/lib/auth";
import { getCurrentUserProfile, type UserProfile } from "@/services/api";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getCurrentUserProfile();
        if (mounted) setProfile(data);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const logout = () => {
    clearAuthToken();
    navigate("/auth", { replace: true });
  };

  const getAgeCategory = (age: number) => {
    if (age <= 17) return { label: "Young Scholar", badge: "border-sky-500 text-sky-400 bg-sky-500/10" };
    if (age <= 24) return { label: "College & Early Career", badge: "border-primary text-primary bg-primary/10" };
    if (age <= 45) return { label: "Professional & Wealth Building", badge: "border-indigo-400 text-indigo-300 bg-indigo-500/10" };
    return { label: "Senior Specialist & Lifelong Learner", badge: "border-purple-400 text-purple-300 bg-purple-500/10" };
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="container max-w-3xl mx-auto">
        <div className="glass-strong rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl space-y-8">
          
          {/* Profile Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-voice flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-cyan-500/20">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {profile?.name || "User Profile"}
                  <ShieldCheck className="w-5 h-5 text-emerald-400" title="Verified Account" />
                </h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{profile?.email}</p>
              </div>
            </div>

            {profile && (
              <Badge variant="outline" className={`text-xs px-3 py-1 ${getAgeCategory(profile.age).badge}`}>
                {getAgeCategory(profile.age).label}
              </Badge>
            )}
          </div>

          {loading && (
            <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">
              Loading your profile from MongoDB...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          {profile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-card/60 border border-white/5 space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> Full Name
                </span>
                <p className="text-sm font-semibold text-foreground">{profile.name}</p>
              </div>

              <div className="p-4 rounded-2xl bg-card/60 border border-white/5 space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Age & Demographic
                </span>
                <p className="text-sm font-semibold text-foreground font-mono">
                  {profile.age} years old
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card/60 border border-white/5 space-y-1 sm:col-span-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-accent" /> Education Background
                </span>
                <p className="text-sm font-semibold text-foreground">{profile.education}</p>
              </div>

              <div className="p-4 rounded-2xl bg-card/60 border border-white/5 space-y-1 sm:col-span-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" /> Registered Email
                </span>
                <p className="text-sm font-semibold text-foreground font-mono">{profile.email}</p>
              </div>
            </div>
          )}

          {/* AI Personalization Details */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/20 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Active AI Personalization
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your profile is actively utilized by the **Education Assistant** to adapt explanation difficulty and by the **Healthcare Assistant** for age-appropriate medical guidelines.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => navigate("/chat")}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold glow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Launch Voice Assistant <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 border border-rose-500/20 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
