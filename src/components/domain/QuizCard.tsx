import React, { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, Award, RotateCcw, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface QuizQuestionData {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface QuizCardProps {
  topic: string;
  questions: QuizQuestionData[];
  onQuizComplete?: (correct: number, total: number) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ topic, questions = [], onQuizComplete }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) return null;

  const handleSelect = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_index) {
        correct++;
      }
    });
    return correct;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const score = calculateScore();

    // Call callback if supplied
    if (onQuizComplete) {
      onQuizComplete(score, questions.length);
    }

    // Also sync to backend API endpoint /education/quiz-submit
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/education/quiz-submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic,
          correct_count: score,
          total_questions: questions.length,
        }),
      });
    } catch {
      // Graceful ignore
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const score = calculateScore();
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <Card className="p-4 bg-card/60 border-primary/20 backdrop-blur my-3">
      <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Check Your Understanding
          </h4>
        </div>
        <Badge variant="outline" className="border-primary/40 text-primary text-[10px] font-mono">
          {totalQuestions} Questions
        </Badge>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => {
          const selected = selectedAnswers[qIdx];
          const isCorrect = selected === q.correct_index;

          return (
            <div key={qIdx} className="space-y-2 border-b border-border/30 pb-3 last:border-b-0 last:pb-0">
              <p className="text-xs font-medium text-foreground">
                <span className="font-bold text-primary font-mono mr-1">{qIdx + 1}.</span> {q.question}
              </p>
              <div className="space-y-1.5 pt-1">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selected === optIdx;
                  let optStyle = "bg-background/50 hover:bg-muted/40 border-border/40 text-foreground/90";

                  if (submitted) {
                    if (optIdx === q.correct_index) {
                      optStyle = "bg-emerald-950/30 border-emerald-500 text-emerald-300 font-medium";
                    } else if (isSelected && !isCorrect) {
                      optStyle = "bg-rose-950/30 border-rose-500 text-rose-300 line-through";
                    } else {
                      optStyle = "bg-background/20 border-transparent text-muted-foreground/50 opacity-60";
                    }
                  } else if (isSelected) {
                    optStyle = "bg-primary/10 border-primary text-primary font-medium";
                  }

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      className={`text-xs p-2.5 rounded-lg border cursor-pointer select-none transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span>
                        <strong className="font-mono mr-2 text-[11px] opacity-75">
                          {String.fromCharCode(65 + optIdx)}.
                        </strong>
                        {opt}
                      </span>
                      {submitted && optIdx === q.correct_index && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Reveal */}
              {submitted && (
                <div className="mt-2 p-2.5 rounded-lg bg-muted/20 border border-border/30 text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quiz Controls & Score Tally */}
      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
        {!submitted ? (
          <Button
            size="sm"
            disabled={answeredCount < totalQuestions}
            onClick={handleSubmit}
            className="h-8 text-xs font-medium ml-auto"
          >
            Check Answers ({answeredCount}/{totalQuestions})
          </Button>
        ) : (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className={`w-4 h-4 ${percentage >= 70 ? "text-amber-400" : "text-primary"}`} />
              <span className="text-xs font-semibold text-foreground font-mono">
                Score: {score}/{totalQuestions} ({percentage}%)
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-mono ${
                  percentage >= 70 ? "border-emerald-500 text-emerald-400" : "border-amber-500 text-amber-400"
                }`}
              >
                {percentage >= 70 ? "Mastered" : "Review Needed"}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={handleReset} className="h-7 text-xs text-muted-foreground">
              <RotateCcw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuizCard;
