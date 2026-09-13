import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseStructuredOutput } from "@/lib/structuredOutputParser";
import FinanceCard from "@/components/domain/FinanceCard";
import RecipeCard from "@/components/domain/RecipeCard";
import EducationCard from "@/components/domain/EducationCard";
import HealthcareCard from "@/components/domain/HealthcareCard";

interface Props {
  content: string;
  /** When true, render as markdown with prose styling; otherwise preserve newlines only */
  allowMarkdown?: boolean;
  className?: string;
}

export default function MessageContent({ content, allowMarkdown = false, className = "" }: Props) {
  if (!content) return null;

  // Check for structured domain payload
  if (typeof content === "string") {
    const structured = parseStructuredOutput(content);
    if (structured.isStructured && structured.data) {
      return (
        <div className={`space-y-3 ${className}`}>
          {structured.humanIntro && (
            <p className="text-sm font-medium text-foreground/90 leading-relaxed">
              {structured.humanIntro}
            </p>
          )}
          {structured.type === "healthcare" && <HealthcareCard data={structured.data} />}
          {structured.type === "finance" && <FinanceCard data={structured.data} />}
          {structured.type === "cooking" && <RecipeCard data={structured.data} />}
          {structured.type === "education" && <EducationCard data={structured.data} />}
        </div>
      );
    }
  }




  if (allowMarkdown) {
    return (
      <div className={`prose prose-sm prose-invert max-w-none ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-0.5">{children}</ul>,
            ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-0.5">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            h1: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
            h2: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>,
            h3: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1">{children}</h4>,
            code: ({ children }) => (
              <code className="bg-muted/50 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
            ),
            pre: ({ children }) => (
              <pre className="bg-muted/30 p-3 rounded-lg overflow-x-auto text-xs my-2">{children}</pre>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return <span className={`whitespace-pre-wrap break-words ${className}`}>{content}</span>;
}

