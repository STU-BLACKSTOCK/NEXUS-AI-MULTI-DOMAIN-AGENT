import { useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import MessageBubble from "./MessageBubble";
import { MessageSquare } from "lucide-react";

export default function ChatWindow() {
  const { messages, isLoading, registerChatScrollContainer, scrollChatToBottom } = useChat();

  useEffect(() => {
    scrollChatToBottom();
  }, [messages, isLoading, scrollChatToBottom]);

  return (
    <div
      ref={registerChatScrollContainer}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4 min-h-0 scroll-smooth"
    >
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 glow-sm">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Ask NexusAI anything about education. Your query will be routed to the appropriate domain assistant.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}
