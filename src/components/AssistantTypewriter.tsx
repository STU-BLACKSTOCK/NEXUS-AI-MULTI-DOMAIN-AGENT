import { useEffect, useState, useMemo } from "react";
import { useChat } from "@/context/ChatContext";
import MessageContent from "./MessageContent";
import { stripMarkdownForTTS } from "@/lib/stripMarkdownForTts";
import { parseStructuredOutput } from "@/lib/structuredOutputParser";
import FinanceCard from "@/components/domain/FinanceCard";
import RecipeCard from "@/components/domain/RecipeCard";
import EducationCard from "@/components/domain/EducationCard";
import HealthcareCard from "@/components/domain/HealthcareCard";

interface Props {
  messageId: string;
  fullText: string;
}

/** Character-by-character reveal; optional parallel TTS when voice mode is on. */
export default function AssistantTypewriter({ messageId, fullText }: Props) {
  const {
    finalizeAssistantTypewriter,
    completeVoiceAssistantTurn,
    getAssistantTtsPlayer,
    isVoiceModeActive,
    scrollChatToBottom,
    setSpeaking,
    setVoiceStatus,
    setVoiceError,
    setVoiceTranscript,
  } = useChat();

  const structured = useMemo(() => parseStructuredOutput(fullText), [fullText]);
  const typewriterTargetText = structured.isStructured && structured.humanIntro ? structured.humanIntro : fullText;

  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let cancelled = false;
    let finished = false;
    const charDelay = () => 15 + Math.floor(Math.random() * 16);

    const run = async () => {
      const ttsPlayer = getAssistantTtsPlayer();
      const ttsText = stripMarkdownForTTS(fullText) || typewriterTargetText;

      const ttsPromise =
        isVoiceModeActive && ttsPlayer
          ? ttsPlayer(ttsText).catch((e: unknown) => {
              setVoiceError(e instanceof Error ? e.message : "TTS failed");
            })
          : Promise.resolve();

      if (isVoiceModeActive) {
        setSpeaking(true);
        setVoiceStatus("speaking");
        setVoiceError(null);
      }

      for (let i = 0; i < typewriterTargetText.length; i++) {
        if (cancelled) break;
        const next = typewriterTargetText.slice(0, i + 1);
        setDisplayed(next);
        scrollChatToBottom();
        await new Promise<void>((r) => {
          window.setTimeout(r, charDelay());
        });
      }

      if (cancelled) return;

      await ttsPromise;

      if (cancelled) return;

      if (isVoiceModeActive) {
        setSpeaking(false);
        setVoiceTranscript("");
        setVoiceStatus("listening");
      }

      finished = true;
      finalizeAssistantTypewriter(messageId, fullText);
      completeVoiceAssistantTurn();
    };

    void run();

    return () => {
      cancelled = true;
      if (!finished) {
        finalizeAssistantTypewriter(messageId, fullText);
        completeVoiceAssistantTurn();
      }
    };
  }, [
    messageId,
    fullText,
    typewriterTargetText,
    completeVoiceAssistantTurn,
    finalizeAssistantTypewriter,
    getAssistantTtsPlayer,
    isVoiceModeActive,
    scrollChatToBottom,
    setSpeaking,
    setVoiceStatus,
    setVoiceError,
    setVoiceTranscript,
  ]);

  if (structured.isStructured && structured.data) {
    return (
      <div className="space-y-3">
        {displayed && <p className="text-sm font-medium text-foreground/90 leading-relaxed">{displayed}</p>}
        {structured.type === "healthcare" && <HealthcareCard data={structured.data} />}
        {structured.type === "finance" && <FinanceCard data={structured.data} />}
        {structured.type === "cooking" && <RecipeCard data={structured.data} />}
        {structured.type === "education" && <EducationCard data={structured.data} />}
      </div>
    );
  }

  return <MessageContent content={displayed} allowMarkdown />;
}

