import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GraduationCap, CheckCircle2, Sparkles, BookOpen } from "lucide-react";
import MermaidDiagram, { DiagramSpecData } from "@/components/domain/MermaidDiagram";
import QuizCard, { QuizQuestionData } from "@/components/domain/QuizCard";

export interface EducationOutputData {
  topic: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  explanation_markdown: string;
  key_takeaways: string[];
  diagram?: DiagramSpecData | null;
  quiz: QuizQuestionData[];
}

interface EducationCardProps {
  data: EducationOutputData;
}

export const EducationCard: React.FC<EducationCardProps> = ({ data }) => {
  const {
    topic,
    difficulty_level = "beginner",
    explanation_markdown,
    key_takeaways = [],
    diagram,
    quiz = [],
  } = data;

  return (
    <div className="space-y-3 my-2 text-foreground">
      {/* Topic Header */}
      <div className="p-4 rounded-xl bg-card/60 border border-border/50 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{topic}</h3>
              <p className="text-[11px] text-muted-foreground capitalize">
                {difficulty_level} Level Explanation
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border/40 capitalize">
            {difficulty_level}
          </span>
        </div>
      </div>

      {/* Explanation Content */}
      {explanation_markdown && (
        <div className="p-4 rounded-xl bg-card/50 border border-border/40">
          <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed text-xs sm:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation_markdown}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Key Concepts */}
      {key_takeaways && key_takeaways.length > 0 && (
        <div className="p-3.5 rounded-xl bg-card/40 border border-border/40 space-y-1.5">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Key Concepts
          </h4>
          <ul className="space-y-1">
            {key_takeaways.map((point, i) => (
              <li key={i} className="text-xs text-foreground/85 flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Diagram */}
      {diagram && diagram.nodes && diagram.nodes.length > 0 && (
        <MermaidDiagram spec={diagram} />
      )}

      {/* Quiz */}
      {quiz && quiz.length > 0 && (
        <QuizCard topic={topic} questions={quiz} />
      )}
    </div>
  );
};

export default EducationCard;
