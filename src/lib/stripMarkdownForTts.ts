import { parseStructuredOutput } from "./structuredOutputParser";

/** Plain text for TTS / speech synthesis (no markdown noise or raw JSON syntax). */
export function stripMarkdownForTTS(text: string): string {
  if (!text) return "";

  // If text contains structured JSON, use parsed TTS text
  const structured = parseStructuredOutput(text);
  if (structured.isStructured && structured.ttsText) {
    return structured.ttsText
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .trim();
  }

  return text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\{"[\s\S]*"\}/g, "") // remove any stray JSON objects
    .trim();
}

