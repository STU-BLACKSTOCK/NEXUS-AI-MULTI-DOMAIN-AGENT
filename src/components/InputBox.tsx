import { useState, useRef, type KeyboardEvent } from "react";
import { Send, Mic, Trash2 } from "lucide-react";
import { useChat } from "@/context/ChatContext";

export default function InputBox() {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, clearChat, isLoading, messages } = useChat();

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    sendMessage(text);
    setText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Placeholder — voice integration would connect here
    setTimeout(() => setIsRecording(false), 3000);
  };

  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask NexusAI anything..."
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-h-[40px] max-h-[120px] py-2 px-1"
          disabled={isLoading}
          aria-label="Chat message input"
        />

        <div className="flex items-center gap-1.5 pb-1">
          {/* Mic button */}
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-lg transition-all ${
              isRecording
                ? "bg-destructive/20 text-destructive animate-pulse-glow"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Clear */}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              aria-label="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!text.trim() || isLoading}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-sm"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
