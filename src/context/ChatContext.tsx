import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { sendChatMessageStream, sendChatMessage, type AssistantMode as ApiAssistantMode } from "@/services/api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  domain?: string;
  assistant?: string;
  collaborationInfo?: string;
  /** Assistant is "thinking" — show typing indicator (stream in progress or post-stream delay). */
  assistantThinking?: boolean;
  /** Full text to reveal with typewriter; cleared when animation finishes. */
  typewriterTarget?: string;
}

/** Voice mode status for the control panel */
export type VoiceStatus = "off" | "listening" | "processing" | "speaking";

export type AssistantMode = ApiAssistantMode;

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  activeDomain: string;
  assistantMode: AssistantMode;
  setAssistantMode: (mode: AssistantMode) => void;
  /** Voice Mode: POST /chat, typing + delay + typewriter; resolves when reply UX + optional TTS complete. */
  sendVoiceMessage: (text: string) => Promise<string>;
  /** Attach scroll container for auto-scroll during typewriter */
  registerChatScrollContainer: (el: HTMLDivElement | null) => void;
  scrollChatToBottom: () => void;
  /** Finalize typewriter: move target text into content, clear flags, end loading state. */
  finalizeAssistantTypewriter: (messageId: string, fullText: string) => void;
  /** Resolve pending voice turn (after typewriter + TTS). */
  completeVoiceAssistantTurn: () => void;
  /** VoiceController registers Edge/browser TTS player (returns Promise that settles when audio ends). */
  setAssistantTtsPlayer: (fn: ((text: string) => Promise<void>) | null) => void;
  getAssistantTtsPlayer: () => ((text: string) => Promise<void>) | null;
  /** Voice Mode state */
  isVoiceModeActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  voiceTranscript: string;
  voiceError: string | null;
  voiceStatus: VoiceStatus;
  setVoiceModeActive: (active: boolean) => void;
  setListening: (listening: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setVoiceTranscript: (transcript: string) => void;
  setVoiceError: (error: string | null) => void;
  setVoiceStatus: (status: VoiceStatus) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const VOICE_SESSION_ID = "default";

function assistantLabel(mode: AssistantMode): string {
  if (mode === "education") return "Education Assistant";
  if (mode === "finance") return "Finance Assistant";
  if (mode === "healthcare") return "Healthcare Assistant";
  if (mode === "cooking") return "Cooking Assistant";
  return "NexusAI Assistant";
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("education");
  const activeDomain =
    assistantMode === "education"
      ? "Education"
      : assistantMode === "finance"
        ? "Finance"
        : assistantMode === "healthcare"
          ? "Healthcare"
          : assistantMode === "cooking"
            ? "Cooking"
            : "Integrated";

  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("off");

  const streamingMsgIdRef = useRef<string | null>(null);
  const streamBufferRef = useRef("");
  const chatScrollParentRef = useRef<HTMLDivElement | null>(null);
  const assistantTtsPlayRef = useRef<((text: string) => Promise<void>) | null>(null);
  const pendingVoiceTurnResolveRef = useRef<(() => void) | null>(null);

  const registerChatScrollContainer = useCallback((el: HTMLDivElement | null) => {
    chatScrollParentRef.current = el;
  }, []);

  const scrollChatToBottom = useCallback(() => {
    const el = chatScrollParentRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const completeVoiceAssistantTurn = useCallback(() => {
    pendingVoiceTurnResolveRef.current?.();
    pendingVoiceTurnResolveRef.current = null;
  }, []);

  const finalizeAssistantTypewriter = useCallback((messageId: string, fullText: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              content: fullText,
              typewriterTarget: undefined,
              assistantThinking: false,
            }
          : m
      )
    );
    setIsLoading(false);
  }, []);

  const setAssistantTtsPlayer = useCallback((fn: ((text: string) => Promise<void>) | null) => {
    assistantTtsPlayRef.current = fn;
  }, []);

  const getAssistantTtsPlayer = useCallback(() => assistantTtsPlayRef.current, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      const assistantMsgId = crypto.randomUUID();
      streamingMsgIdRef.current = assistantMsgId;
      streamBufferRef.current = "";

      const placeholderMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        assistantThinking: true,
        domain: activeDomain,
        assistant: assistantLabel(assistantMode),
      };

      setMessages((prev) => [...prev, userMsg, placeholderMsg]);
      setIsLoading(true);
      setError(null);

      await sendChatMessageStream(
        text.trim(),
        {
          onToken(token) {
            if (streamingMsgIdRef.current !== assistantMsgId) return;
            streamBufferRef.current += token;
          },
          onDone(data) {
            if (streamingMsgIdRef.current !== assistantMsgId) return;
            streamingMsgIdRef.current = null;
            const fullText = (data.response && data.response.length > 0 ? data.response : streamBufferRef.current) ?? "";
            const delayMs = 1000 + Math.random() * 1000;

            window.setTimeout(() => {
              if (!fullText.trim()) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          assistantThinking: false,
                          content: "",
                          domain: data.domain ?? m.domain,
                          assistant: data.assistant ?? m.assistant,
                        }
                      : m
                  )
                );
                setIsLoading(false);
                return;
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        assistantThinking: false,
                        typewriterTarget: fullText,
                        domain: data.domain ?? m.domain,
                        assistant: data.assistant ?? m.assistant,
                      }
                    : m
                )
              );
            }, delayMs);
          },
          onError(message) {
            if (streamingMsgIdRef.current === assistantMsgId) streamingMsgIdRef.current = null;
            setError(message);
            const friendly =
              message.toLowerCase().includes("login required") || message.toLowerCase().includes("401")
                ? "⚠️ Please login or register first to start chatting."
                : `⚠️ ${message}`;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: friendly,
                      domain: "System",
                      assistantThinking: false,
                      typewriterTarget: undefined,
                    }
                  : m
              )
            );
            setIsLoading(false);
          },
        },
        "default",
        assistantMode
      );
    },
    [activeDomain, assistantMode]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    pendingVoiceTurnResolveRef.current = null;
  }, []);

  const sendVoiceMessage = useCallback(
    (text: string): Promise<string> => {
      if (!text.trim()) return Promise.resolve("");

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      const assistantMsgId = crypto.randomUUID();
      const assistantPlaceholder: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        assistantThinking: true,
        domain: activeDomain,
        assistant: assistantLabel(assistantMode),
      };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);

      return new Promise<string>((resolve, reject) => {
        sendChatMessage(text.trim(), VOICE_SESSION_ID, assistantMode)
          .then((data) => {
            const responseText = data.response ?? "";
            const delayMs = 1000 + Math.random() * 1000;

            window.setTimeout(() => {
              if (!responseText.trim()) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, assistantThinking: false, content: "", domain: data.domain ?? m.domain }
                      : m
                  )
                );
                resolve(responseText);
                return;
              }

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        assistantThinking: false,
                        typewriterTarget: responseText,
                        domain: data.domain ?? m.domain,
                        assistant: data.assistant ?? assistantLabel(assistantMode),
                      }
                    : m
                )
              );

              pendingVoiceTurnResolveRef.current = () => {
                pendingVoiceTurnResolveRef.current = null;
                resolve(responseText);
              };
            }, delayMs);
          })
          .catch((err) => {
            const errMsg = err instanceof Error ? err.message : "Request failed";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: `⚠️ Sorry, I couldn't process your request. ${errMsg}`,
                      domain: "System",
                      assistantThinking: false,
                      typewriterTarget: undefined,
                    }
                  : m
              )
            );
            reject(err);
          });
      });
    },
    [activeDomain, assistantMode]
  );

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        error,
        sendMessage,
        clearChat,
        activeDomain,
        assistantMode,
        setAssistantMode,
        sendVoiceMessage,
        registerChatScrollContainer,
        scrollChatToBottom,
        finalizeAssistantTypewriter,
        completeVoiceAssistantTurn,
        setAssistantTtsPlayer,
        getAssistantTtsPlayer,
        isVoiceModeActive,
        isListening,
        isSpeaking,
        voiceTranscript,
        voiceError,
        voiceStatus,
        setVoiceModeActive: setIsVoiceModeActive,
        setListening: setIsListening,
        setSpeaking: setIsSpeaking,
        setVoiceTranscript,
        setVoiceError,
        setVoiceStatus,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
