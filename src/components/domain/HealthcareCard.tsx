import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HeartPulse, AlertOctagon, PhoneCall, CheckCircle2, Stethoscope, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MermaidDiagram, { DiagramSpecData } from "@/components/domain/MermaidDiagram";

export interface SafetyBannerData {
  is_emergency: boolean;
  severity: "none" | "mild" | "moderate" | "urgent" | "emergency";
  banner_message?: string;
  action_required?: string;
  emergency_contacts?: string[];
}

export interface HealthcareOutputData {
  safety_banner: SafetyBannerData;
  topic_or_symptoms: string;
  general_guidance_markdown: string;
  possible_causes_or_context: string[];
  timeline_or_schedule?: DiagramSpecData | null;
  precautions: string[];
  when_to_see_doctor: string[];
  disclaimer?: string;
}

interface HealthcareCardProps {
  data: HealthcareOutputData;
}

export const HealthcareCard: React.FC<HealthcareCardProps> = ({ data }) => {
  const {
    safety_banner,
    topic_or_symptoms,
    general_guidance_markdown,
    possible_causes_or_context = [],
    timeline_or_schedule,
    precautions = [],
    when_to_see_doctor = [],
    disclaimer,
  } = data;

  const isEmergency = safety_banner?.is_emergency;

  return (
    <div className="space-y-3 my-2 text-foreground">
      {/* Emergency Alert Banner */}
      {isEmergency && (
        <div className="p-4 rounded-xl bg-rose-950/40 border-2 border-rose-500/80 text-rose-100 shadow-md space-y-2.5 animate-pulse">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertOctagon className="w-5 h-5 shrink-0 text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
              Critical Health Alert — Seek Immediate Care
            </h3>
          </div>
          {safety_banner.banner_message && (
            <p className="text-xs font-semibold text-rose-100 leading-snug">
              {safety_banner.banner_message}
            </p>
          )}
          {safety_banner.action_required && (
            <p className="text-xs text-rose-200 bg-rose-900/50 p-2 rounded-lg border border-rose-700/40">
              <strong>Action:</strong> {safety_banner.action_required}
            </p>
          )}
          {safety_banner.emergency_contacts && safety_banner.emergency_contacts.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-rose-300 font-medium flex items-center gap-1">
                <PhoneCall className="w-3 h-3" /> Hotlines:
              </span>
              {safety_banner.emergency_contacts.map((contact, idx) => (
                <Badge key={idx} variant="outline" className="bg-rose-900/40 border-rose-500/50 text-rose-200 text-[11px] font-mono">
                  {contact}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-card/60 border border-border/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
              <HeartPulse className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{topic_or_symptoms}</h3>
              <p className="text-[11px] text-muted-foreground">Clinical & Wellness Reference</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border/40">
            Health Guidance
          </span>
        </div>
      </div>

      {/* General Guidance Section */}
      {general_guidance_markdown && (
        <div className="p-4 rounded-xl bg-card/50 border border-border/40">
          <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed text-xs sm:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{general_guidance_markdown}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Potential Clinical Context */}
      {possible_causes_or_context && possible_causes_or_context.length > 0 && (
        <div className="p-3.5 rounded-xl bg-card/40 border border-border/40 space-y-1.5">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-teal-400" /> Potential Clinical Context
          </h4>
          <ul className="space-y-1">
            {possible_causes_or_context.map((cause, i) => (
              <li key={i} className="text-xs text-foreground/85 flex items-start gap-2">
                <span className="text-teal-400 font-bold">•</span>
                <span>{cause}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Diagram Timeline */}
      {timeline_or_schedule && timeline_or_schedule.nodes && timeline_or_schedule.nodes.length > 0 && (
        <MermaidDiagram spec={timeline_or_schedule} />
      )}

      {/* Precautions */}
      {precautions && precautions.length > 0 && (
        <div className="p-3.5 rounded-xl bg-card/40 border border-border/40 space-y-1.5">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Recommended Precautions
          </h4>
          <ul className="space-y-1">
            {precautions.map((item, i) => (
              <li key={i} className="text-xs text-foreground/85 flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* When to Seek Doctor */}
      {when_to_see_doctor && when_to_see_doctor.length > 0 && (
        <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/30 space-y-1.5">
          <h4 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> When to Seek Medical Attention
          </h4>
          <ul className="space-y-1">
            {when_to_see_doctor.map((indicator, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                <span className="text-amber-400">•</span>
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Medical Disclaimer */}
      {disclaimer && (
        <p className="text-[10px] text-muted-foreground/60 italic text-center px-2">
          {disclaimer}
        </p>
      )}
    </div>
  );
};

export default HealthcareCard;
