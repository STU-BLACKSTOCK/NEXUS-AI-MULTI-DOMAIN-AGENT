import React, { useState, useEffect } from "react";
import {
  Utensils,
  Clock,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Check,
  Sparkles,
  ChefHat,
  Shuffle,
  ChevronRight,
  ChevronLeft,
  Volume2,
  ListOrdered,
  Layers,
  CheckCircle2,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface RecipeIngredientData {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface RecipeStepData {
  step_number: number;
  instruction: string;
  timer_seconds?: number;
}

export interface SubstitutionOptionData {
  original_ingredient: string;
  substitute_name: string;
  ratio_or_notes: string;
}

export interface NutritionFactsData {
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  servings: number;
  calories_per_serving: number;
}

export interface CookingRecipeData {
  title: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  ingredients: RecipeIngredientData[];
  steps: RecipeStepData[];
  substitutions?: SubstitutionOptionData[];
  nutrition: NutritionFactsData;
  chef_tips?: string[];
}

interface StepTimerProps {
  initialSeconds: number;
  stepNumber: number;
}

const StepTimer: React.FC<StepTimerProps> = ({ initialSeconds, stepNumber }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTimeLeft(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds, stepNumber]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isCompleted = timeLeft === 0;

  return (
    <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-card/70 border border-border/60 text-xs font-mono">
      <Clock className={`w-4 h-4 ${isRunning ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
      <span className={`font-semibold ${isCompleted ? "text-emerald-400 font-bold" : "text-foreground"}`}>
        {isCompleted ? "Step Timer Complete! 🔔" : `Timer: ${formatTime(timeLeft)}`}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        {!isCompleted && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs font-sans border-border/60 hover:border-primary/50"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {isRunning ? "Pause" : "Start"}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setIsRunning(false);
            setTimeLeft(initialSeconds);
          }}
          title="Reset timer"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export const RecipeCard: React.FC<{ data: CookingRecipeData }> = ({ data }) => {
  const {
    title,
    description,
    prep_time_minutes,
    cook_time_minutes,
    servings,
    difficulty,
    ingredients = [],
    steps = [],
    substitutions = [],
    nutrition,
    chef_tips = [],
  } = data;

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"guided" | "overview">("guided");
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [showDetails, setShowDetails] = useState(false);

  const currentStep = steps[activeStepIndex];
  const totalSteps = steps.length;
  const isLastStep = activeStepIndex === totalSteps - 1;
  const isFirstStep = activeStepIndex === 0;

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleStepCompleted = (stepIdx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [stepIdx]: !prev[stepIdx] }));
  };

  const handleSpeakStep = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="space-y-3 my-2 text-foreground">
      {/* Recipe Header - Minimalist & Stable */}
      <div className="p-4 rounded-xl bg-card/60 border border-border/50 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <ChefHat className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
              <p className="text-xs text-muted-foreground">
                {servings} servings • Prep: {prep_time_minutes}m • Cook: {cook_time_minutes}m
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono capitalize bg-secondary text-muted-foreground border border-border/40">
              {difficulty}
            </span>

            {/* Mode Switcher */}
            <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border/40 text-xs">
              <button
                onClick={() => setViewMode("guided")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                  viewMode === "guided"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListOrdered className="w-3 h-3" /> Step-by-Step
              </button>
              <button
                onClick={() => setViewMode("overview")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                  viewMode === "overview"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3 h-3" /> Full Recipe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GUIDED STEP-BY-STEP MODE (Human-Centric & One Step at a Time) */}
      {viewMode === "guided" && currentStep && (
        <div className="space-y-3">
          {/* Active Step Card */}
          <div className="p-4 rounded-xl bg-card/80 border border-primary/25 shadow-md space-y-3">
            {/* Step Progress Header */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                Step {currentStep.step_number} of {totalSteps}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSpeakStep(`Step ${currentStep.step_number}. ${currentStep.instruction}`)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                  title="Read step aloud"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Read
                </button>
                <button
                  onClick={() => toggleStepCompleted(activeStepIndex)}
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-all ${
                    completedSteps[activeStepIndex]
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Check className="w-3 h-3" /> {completedSteps[activeStepIndex] ? "Done" : "Mark Done"}
                </button>
              </div>
            </div>

            {/* Instruction Body */}
            <p className="text-sm text-foreground/95 leading-relaxed font-normal pt-1">
              {currentStep.instruction}
            </p>

            {/* Optional Step Timer */}
            {currentStep.timer_seconds && currentStep.timer_seconds > 0 && (
              <StepTimer
                initialSeconds={currentStep.timer_seconds}
                stepNumber={currentStep.step_number}
              />
            )}

            {/* Step Progress Track */}
            <div className="flex items-center gap-1 pt-2">
              {steps.map((s, idx) => (
                <button
                  key={s.step_number}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all flex-1 ${
                    idx === activeStepIndex
                      ? "bg-primary"
                      : completedSteps[idx]
                      ? "bg-emerald-500/70"
                      : "bg-muted/40 hover:bg-muted"
                  }`}
                  title={`Go to step ${s.step_number}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                disabled={isFirstStep}
                onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                className="gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev Step
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (isLastStep) {
                    toggleStepCompleted(activeStepIndex);
                  } else {
                    toggleStepCompleted(activeStepIndex);
                    setActiveStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
                  }
                }}
                className="gap-1 text-xs font-medium"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete Recipe 🎉
                  </>
                ) : (
                  <>
                    Next Step <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Toggle for Ingredients & Nutrition */}
          <div className="text-center">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline inline-flex items-center gap-1"
            >
              <Info className="w-3 h-3" />
              {showDetails ? "Hide Ingredients & Macro Details" : `View Ingredients (${ingredients.length}) & Nutrition`}
            </button>
          </div>
        </div>
      )}

      {/* FULL RECIPE OVERVIEW OR EXPANDED DETAILS */}
      {(viewMode === "overview" || showDetails) && (
        <div className="space-y-3 pt-1">
          {/* Nutrition Facts Bar */}
          {nutrition && (
            <div className="p-3 rounded-xl bg-card/50 border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Calculated Nutrition (Per Serving)
                </span>
                <span className="text-xs font-mono font-semibold text-primary">
                  {nutrition.calories_per_serving} kcal
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-1.5 rounded bg-secondary/50 border border-border/30">
                  <p className="text-muted-foreground text-[10px]">Protein</p>
                  <p className="font-semibold text-foreground font-mono">{nutrition.protein_g}g</p>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 border border-border/30">
                  <p className="text-muted-foreground text-[10px]">Carbs</p>
                  <p className="font-semibold text-foreground font-mono">{nutrition.carbs_g}g</p>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 border border-border/30">
                  <p className="text-muted-foreground text-[10px]">Fat</p>
                  <p className="font-semibold text-foreground font-mono">{nutrition.fat_g}g</p>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 border border-border/30">
                  <p className="text-muted-foreground text-[10px]">Fiber</p>
                  <p className="font-semibold text-foreground font-mono">{nutrition.fiber_g}g</p>
                </div>
              </div>
            </div>
          )}

          {/* Ingredients Checklist */}
          {ingredients.length > 0 && (
            <div className="p-3.5 rounded-xl bg-card/50 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-primary" /> Ingredients
                </h4>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {Object.values(checkedIngredients).filter(Boolean).length}/{ingredients.length} checked
                </span>
              </div>
              <ul className="space-y-1">
                {ingredients.map((ing, i) => {
                  const isChecked = !!checkedIngredients[i];
                  return (
                    <li
                      key={i}
                      onClick={() => toggleIngredient(i)}
                      className={`text-xs cursor-pointer select-none flex items-center gap-2 p-1.5 rounded transition-colors ${
                        isChecked ? "line-through text-muted-foreground/50 bg-secondary/20" : "hover:bg-secondary/40 text-foreground"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                          isChecked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span>
                        <strong className="font-mono font-medium">
                          {ing.quantity} {ing.unit}
                        </strong>{" "}
                        {ing.name}
                        {ing.notes && <span className="text-muted-foreground italic"> ({ing.notes})</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Full Step List (when in Overview Mode) */}
          {viewMode === "overview" && steps.length > 0 && (
            <div className="p-3.5 rounded-xl bg-card/50 border border-border/40 space-y-3">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> All Steps
              </h4>
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.step_number} className="border-l-2 border-primary/40 pl-3 py-0.5">
                    <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      Step {step.step_number}
                    </span>
                    <p className="text-xs text-foreground/90 leading-relaxed mt-1">{step.instruction}</p>
                    {step.timer_seconds && step.timer_seconds > 0 && (
                      <StepTimer initialSeconds={step.timer_seconds} stepNumber={step.step_number} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tested Substitutions */}
          {substitutions && substitutions.length > 0 && (
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/30">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shuffle className="w-3 h-3 text-sky-400" /> Tested Substitutions
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {substitutions.map((sub, i) => (
                  <div key={i} className="p-2 rounded-lg bg-card/60 border border-border/30 text-xs">
                    <p className="font-medium text-foreground">
                      <span className="text-primary font-mono">{sub.original_ingredient}</span> ➔{" "}
                      <span className="text-sky-400 font-mono">{sub.substitute_name}</span>
                    </p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">{sub.ratio_or_notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chef's Tips */}
          {chef_tips && chef_tips.length > 0 && (
            <div className="p-3 rounded-xl bg-card/40 border border-border/30">
              <h4 className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" /> Chef Tips
              </h4>
              <ul className="space-y-1">
                {chef_tips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipeCard;
