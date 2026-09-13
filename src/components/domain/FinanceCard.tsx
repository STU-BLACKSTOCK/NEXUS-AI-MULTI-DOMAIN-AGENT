import React from "react";
import { TrendingUp, AlertTriangle, CheckCircle2, DollarSign, PieChart, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export interface FinanceMetricsData {
  total_expenses?: number;
  net_savings_monthly?: number;
  savings_rate_pct?: number;
  needs_wants_savings_ratio?: {
    needs?: number;
    wants?: number;
    savings?: number;
  };
  emergency_fund_months?: number;
  projected_balance?: number;
  months_to_reach_goal?: number;
  months_to_payoff_debt?: number;
  total_interest_paid_or_earned?: number;
}

export interface FinanceOutputData {
  summary: string;
  metrics: FinanceMetricsData;
  recommendations: string[];
  risks: string[];
  disclaimer?: string;
}

interface FinanceCardProps {
  data: FinanceOutputData;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({ data }) => {
  const { summary, metrics, recommendations = [], risks = [], disclaimer } = data;
  const isPositiveSavings = (metrics.net_savings_monthly ?? 0) >= 0;

  return (
    <div className="space-y-3 my-2 text-foreground">
      {/* Executive Summary */}
      <div className="p-4 rounded-xl bg-card/60 border border-border/50 backdrop-blur-sm space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Financial Overview</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border/40">
            Calculated Engine
          </span>
        </div>
        <p className="text-xs text-foreground/90 leading-relaxed pt-1">
          {summary}
        </p>
      </div>

      {/* Computed Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {metrics.total_expenses !== undefined && metrics.total_expenses > 0 && (
          <div className="p-3 rounded-xl bg-card/50 border border-border/40">
            <p className="text-[11px] text-muted-foreground">Monthly Expenses</p>
            <p className="text-base font-bold text-foreground mt-0.5 font-mono">
              ${metrics.total_expenses.toLocaleString()}
            </p>
          </div>
        )}

        {metrics.net_savings_monthly !== undefined && (
          <div className="p-3 rounded-xl bg-card/50 border border-border/40">
            <p className="text-[11px] text-muted-foreground">Net Monthly Cashflow</p>
            <p
              className={`text-base font-bold mt-0.5 font-mono ${
                isPositiveSavings ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositiveSavings ? "+" : ""}${metrics.net_savings_monthly.toLocaleString()}
            </p>
          </div>
        )}

        {metrics.savings_rate_pct !== undefined && metrics.savings_rate_pct !== null && (
          <div className="p-3 rounded-xl bg-card/50 border border-border/40">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">Savings Rate</p>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
              {metrics.savings_rate_pct.toFixed(1)}%
            </p>
            <Progress value={Math.min(100, Math.max(0, metrics.savings_rate_pct))} className="h-1 mt-1.5 bg-muted/40" />
          </div>
        )}

        {metrics.emergency_fund_months !== undefined && metrics.emergency_fund_months !== null && (
          <div className="p-3 rounded-xl bg-card/50 border border-border/40">
            <p className="text-[11px] text-muted-foreground">Emergency Runway</p>
            <p className="text-base font-bold text-sky-400 mt-0.5 font-mono">
              {metrics.emergency_fund_months.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">mos</span>
            </p>
          </div>
        )}

        {metrics.projected_balance !== undefined && metrics.projected_balance !== null && (
          <div className="p-3 rounded-xl bg-card/50 border border-border/40">
            <p className="text-[11px] text-muted-foreground">Projected Growth</p>
            <p className="text-base font-bold text-primary mt-0.5 font-mono">
              ${metrics.projected_balance.toLocaleString()}
            </p>
          </div>
        )}

        {metrics.months_to_payoff_debt !== undefined && metrics.months_to_payoff_debt !== null && (
          <div className="p-3 rounded-xl bg-card/50 border border-border/40">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">Debt Free In</p>
              <Calendar className="w-3 h-3 text-muted-foreground" />
            </div>
            <p className="text-base font-bold text-foreground mt-0.5 font-mono">
              {metrics.months_to_payoff_debt >= 999 ? ">80 yrs" : `${metrics.months_to_payoff_debt} mos`}
            </p>
          </div>
        )}
      </div>

      {/* 50/30/20 Ratio Bar */}
      {metrics.needs_wants_savings_ratio && (
        <div className="p-3 rounded-xl bg-card/50 border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-primary" /> 50 / 30 / 20 Budget Ratio
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Needs {metrics.needs_wants_savings_ratio.needs}% | Wants {metrics.needs_wants_savings_ratio.wants}% | Savings {metrics.needs_wants_savings_ratio.savings}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-muted/30">
            <div
              style={{ width: `${metrics.needs_wants_savings_ratio.needs || 0}%` }}
              className="bg-sky-500 h-full"
              title="Needs"
            />
            <div
              style={{ width: `${metrics.needs_wants_savings_ratio.wants || 0}%` }}
              className="bg-amber-500 h-full"
              title="Wants"
            />
            <div
              style={{ width: `${metrics.needs_wants_savings_ratio.savings || 0}%` }}
              className="bg-emerald-500 h-full"
              title="Savings"
            />
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="p-3.5 rounded-xl bg-card/50 border border-border/40 space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Strategic Recommendations
          </h4>
          <ul className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-foreground/85 flex items-start gap-2 leading-relaxed">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Factors */}
      {risks.length > 0 && (
        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 space-y-1.5">
          <h4 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Risk Considerations
          </h4>
          <ul className="space-y-1">
            {risks.map((risk, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                <span className="text-amber-400">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {disclaimer && (
        <p className="text-[10px] text-muted-foreground/60 italic text-center px-2">
          {disclaimer}
        </p>
      )}
    </div>
  );
};

export default FinanceCard;
