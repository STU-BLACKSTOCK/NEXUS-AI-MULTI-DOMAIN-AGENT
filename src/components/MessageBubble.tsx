import { useEffect, useState } from "react";
import type { Message } from "@/context/ChatContext";
import { Bot, User, Info } from "lucide-react";
import MessageContent from "./MessageContent";
import AssistantTypewriter from "./AssistantTypewriter";

interface Props {
  message: Message;
}

function TypingIndicator() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setDots((d) => (d + 1) % 4), 420);
    return () => window.clearInterval(id);
  }, []);
  const suffix = ".".repeat(dots);
  return (
    <span className="text-muted-foreground italic tabular-nums" aria-live="polite">
      Typing{suffix}
    </span>
  );
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const time = message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const showThinking = message.role === "assistant" && message.assistantThinking;
  const showTypewriter =
    message.role === "assistant" && message.typewriterTarget != null && message.typewriterTarget.length > 0;

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
          isUser ? "bg-primary/20" : "bg-secondary"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && message.domain && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary/80 px-2 py-0.5 rounded bg-primary/10">
            {message.assistant || message.domain}
          </span>
        )}

        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-secondary text-secondary-foreground rounded-bl-md"
          }`}
        >
          {isUser && <MessageContent content={message.content} allowMarkdown={false} />}
          {!isUser && showThinking && <TypingIndicator />}
          {!isUser && showTypewriter && message.typewriterTarget != null && (
            <AssistantTypewriter messageId={message.id} fullText={message.typewriterTarget} />
          )}
          {!isUser && !showThinking && !showTypewriter && (
            <MessageContent content={message.content} allowMarkdown />
          )}
        </div>

        {message.collaborationInfo && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 mt-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-warning" />
            <span>{message.collaborationInfo}</span>
          </div>
        )}

        <span className="text-[10px] text-muted-foreground/60 px-1">{time}</span>
      </div>
    </div>
  );
}
