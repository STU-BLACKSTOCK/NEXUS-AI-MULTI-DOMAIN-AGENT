/**
 * Returns a preferred SpeechSynthesisVoice for TTS: natural-sounding female voice when available.
 * Voices are loaded asynchronously by the browser, so we use state that updates after voiceschanged.
 */

import { useState, useEffect } from "react";

const LANG = "en-US";
const FEMALE_KEYWORDS = ["female", "woman", "zira", "samantha", "karen", "victoria", "aria", "emma", "susan", "hazel", "google uk female", "microsoft aria"];
const MALE_KEYWORDS = ["male", "man", "david", "daniel", "mark", "paul", "google uk male"];

function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  const langMatch = voice.lang.startsWith(LANG) || voice.lang.startsWith("en");
  if (!langMatch) return -1;
  if (voice.default) return 100;
  for (const k of FEMALE_KEYWORDS) {
    if (name.includes(k)) return 90;
  }
  for (const k of MALE_KEYWORDS) {
    if (name.includes(k)) return 10;
  }
  return 50;
}

export function usePreferredVoice(): SpeechSynthesisVoice | null {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const setBest = () => {
      const voices = window.speechSynthesis.getVoices();
      const en = voices.filter((v) => v.lang.startsWith("en"));
      if (en.length === 0) return;
      const best = en.reduce((a, b) => (scoreVoice(a) >= scoreVoice(b) ? a : b));
      setVoice(best);
    };

    setBest();
    window.speechSynthesis.onvoiceschanged = setBest;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  return voice;
}
