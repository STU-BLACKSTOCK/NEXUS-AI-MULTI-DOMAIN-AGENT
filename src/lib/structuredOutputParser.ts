/**
 * Parser for structured domain outputs from NexusAI assistant pipelines.
 * Extracts domain cards, conversational human introductions, and natural TTS speech text,
 * preventing raw JSON brackets or schema strings from leaking onto user screens or speech synthesis.
 */

export interface ParsedStructuredOutput {
  isStructured: boolean;
  type?: "cooking" | "finance" | "education" | "healthcare";
  data?: any;
  humanIntro?: string;
  ttsText?: string;
  rawText: string;
}

export function parseStructuredOutput(content: string): ParsedStructuredOutput {
  if (!content || typeof content !== "string") {
    return { isStructured: false, rawText: content || "" };
  }

  let trimmed = content.trim();

  // Strip wrapping markdown code fences if present (e.g. ```json ... ```)
  if (trimmed.startsWith("```json")) {
    trimmed = trimmed.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
  } else if (trimmed.startsWith("```")) {
    trimmed = trimmed.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const data = JSON.parse(trimmed);

      // 1. Healthcare
      if (data && data.safety_banner && data.topic_or_symptoms && data.general_guidance_markdown) {
        const isEmergency = !!data.safety_banner?.is_emergency;
        const bannerMsg = data.safety_banner?.banner_message || "";
        const intro = isEmergency
          ? `⚠️ Critical Health Advisory: ${bannerMsg}`
          : `Here is the clinical guidance and safety information for ${data.topic_or_symptoms}:`;
        const tts = isEmergency
          ? `Critical Health Advisory. ${bannerMsg}. ${data.safety_banner?.action_required || ""}. Please contact emergency services if needed.`
          : `Here is the guidance for ${data.topic_or_symptoms}. ${data.general_guidance_markdown.replace(/#{1,6}\s*/g, "").slice(0, 220)}`;

        return {
          isStructured: true,
          type: "healthcare",
          data,
          humanIntro: intro,
          ttsText: tts,
          rawText: content,
        };
      }

      // 2. Finance
      if (data && data.metrics && data.summary && Array.isArray(data.recommendations)) {
        const intro = data.summary;
        const tts = `Here is your financial analysis summary: ${data.summary}. ${
          data.recommendations.length > 0 ? "First recommendation: " + data.recommendations[0] : ""
        }`;

        return {
          isStructured: true,
          type: "finance",
          data,
          humanIntro: intro,
          ttsText: tts,
          rawText: content,
        };
      }

      // 3. Cooking
      if (data && data.title && Array.isArray(data.ingredients) && Array.isArray(data.steps)) {
        const title = data.title;
        const desc = data.description || "Here is your guided step-by-step recipe.";
        const intro = `I've prepared the recipe for ${title}. ${desc}`;
        let tts = `Here is the recipe for ${title}. ${desc}. `;
        if (data.steps && data.steps.length > 0) {
          tts += `Let's start with Step 1: ${data.steps[0].instruction}`;
        }

        return {
          isStructured: true,
          type: "cooking",
          data,
          humanIntro: intro,
          ttsText: tts,
          rawText: content,
        };
      }

      // 4. Education
      if (data && data.topic && data.explanation_markdown && (Array.isArray(data.quiz) || Array.isArray(data.key_takeaways))) {
        const firstPara = data.explanation_markdown.split("\n\n")[0]?.replace(/#{1,6}\s*/g, "").trim() || "";
        const intro = `Here is the breakdown for ${data.topic}:`;
        const tts = `Here is the lesson on ${data.topic}. ${firstPara.slice(0, 250)}`;

        return {
          isStructured: true,
          type: "education",
          data,
          humanIntro: intro,
          ttsText: tts,
          rawText: content,
        };
      }
    } catch {
      // JSON parse error, fall back to plain text
    }
  }

  return { isStructured: false, rawText: content };
}
