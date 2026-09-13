/**
 * VoiceController – Modular voice interaction component for the Multi-Domain Voice Assistant.
 *
 * Implements a continuous voice loop: Listen → STT → POST /chat → TTS → Listen again.
 * Uses browser-native Web Speech API (SpeechRecognition) + backend Edge TTS (MP3 playback).
 * All voice logic is encapsulated here; ChatContext holds state for UI display.
 */

import { useCallback, useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import { fetchTtsMp3 } from "@/services/api";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Get SpeechRecognition constructor (Chrome, Edge, Safari) */
function getSpeechRecognition(): (typeof SpeechRecognition) | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

/** Check if Web Speech APIs are supported */
function isSpeechSupported(): boolean {
  return !!getSpeechRecognition() && typeof Audio !== "undefined";
}

/** Reused so repeated Start Voice Mode clicks do not leak AudioContexts. */
let sharedAudioUnlockContext: AudioContext | null = null;

/**
 * Run inside the user gesture (e.g. Start Voice Mode click).
 * Browsers often block `HTMLAudioElement.play()` after long async gaps unless
 * audio output was already unlocked for this tab.
 */
function unlockAudioOutput(): void {
  if (typeof window === "undefined") return;
  try {
    const AnyWin = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext ?? AnyWin.webkitAudioContext;
    if (!AC) return;
    if (!sharedAudioUnlockContext || sharedAudioUnlockContext.state === "closed") {
      sharedAudioUnlockContext = new AC();
    }
    void sharedAudioUnlockContext.resume();
    const ctx = sharedAudioUnlockContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {
    /* ignore */
  }
}

/** Fallback when Edge TTS MP3 fails or play() is blocked — uses the same Web Speech engine family as STT. */
function speakWithBrowserTTS(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const syn = window.speechSynthesis;
    if (!syn) {
      reject(new Error("Speech synthesis not available"));
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      resolve();
      return;
    }
    syn.cancel();
    const utter = new SpeechSynthesisUtterance(trimmed);
    utter.rate = 0.98;
    const voices = syn.getVoices();
    const preferred =
      voices.find((v) => v.default && v.lang.toLowerCase().startsWith("en")) ??
      voices.find((v) => v.lang.toLowerCase().startsWith("en-us")) ??
      voices.find((v) => v.lang.toLowerCase().startsWith("en"));
    if (preferred) utter.voice = preferred;
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error("Browser TTS failed"));
    syn.speak(utter);
  });
}

export default function VoiceController() {
  const {
    sendVoiceMessage,
    isVoiceModeActive,
    setVoiceModeActive,
    setListening,
    setSpeaking,
    setVoiceTranscript,
    setVoiceError,
    setVoiceStatus,
    setAssistantTtsPlayer,
    voiceTranscript,
    voiceError,
    voiceStatus,
  } = useChat();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsObjectUrlRef = useRef<string | null>(null);
  const isActiveRef = useRef(false);
  /** Prevents recognition.onend from restarting while we're processing or speaking */
  const isProcessingOrSpeakingRef = useRef(false);
  /** Latest startListening — avoids circular deps with processTranscript */
  const startListeningRef = useRef<(() => void) | null>(null);

  /** Stop STT so we are not capturing during API + TTS; clears ref so follow-up can start fresh. */
  const stopRecognitionOnly = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  }, []);

  /**
   * Play assistant audio for voice mode (used by AssistantTypewriter in sync with on-screen typing).
   * Does not restart the mic — VoiceController does that after sendVoiceMessage settles.
   */
  const playAssistantTts = useCallback(
    (speakText: string): Promise<void> =>
      new Promise((resolve) => {
        const cleanupUrls = () => {
          setVoiceError(null);
          if (ttsObjectUrlRef.current) {
            URL.revokeObjectURL(ttsObjectUrlRef.current);
            ttsObjectUrlRef.current = null;
          }
          ttsAudioRef.current = null;
        };

        const finish = () => {
          cleanupUrls();
          resolve();
        };

        const failAndFinish = (message: string) => {
          cleanupUrls();
          setVoiceError(message);
          resolve();
        };

        void (async () => {
          try {
            const blob = await fetchTtsMp3(speakText);
            if (blob.size < 64) {
              throw new Error("TTS audio was empty or invalid");
            }
            if (ttsObjectUrlRef.current) {
              URL.revokeObjectURL(ttsObjectUrlRef.current);
              ttsObjectUrlRef.current = null;
            }
            const url = URL.createObjectURL(blob);
            ttsObjectUrlRef.current = url;
            const audio = new Audio(url);
            ttsAudioRef.current = audio;
            try {
              audio.setAttribute("playsinline", "true");
            } catch {
              /* ignore */
            }
            audio.onended = () => finish();
            audio.onerror = () => {
              audio.onended = null;
              audio.onerror = null;
              try {
                audio.pause();
              } catch {
                /* ignore */
              }
              ttsAudioRef.current = null;
              if (ttsObjectUrlRef.current) {
                URL.revokeObjectURL(ttsObjectUrlRef.current);
                ttsObjectUrlRef.current = null;
              }
              void speakWithBrowserTTS(speakText)
                .then(() => finish())
                .catch(() => {
                  failAndFinish(
                    "Voice playback failed (MP3 decode or network). Check API /tts and try again."
                  );
                });
            };
            try {
              await audio.play();
            } catch (playErr) {
              audio.onended = null;
              audio.onerror = null;
              try {
                audio.pause();
              } catch {
                /* ignore */
              }
              ttsAudioRef.current = null;
              if (ttsObjectUrlRef.current) {
                URL.revokeObjectURL(ttsObjectUrlRef.current);
                ttsObjectUrlRef.current = null;
              }
              const playMsg = playErr instanceof Error ? playErr.message : String(playErr);
              try {
                await speakWithBrowserTTS(speakText);
                finish();
              } catch {
                failAndFinish(
                  playMsg.toLowerCase().includes("notallowed") || playMsg.includes("interrupted")
                    ? "Playback blocked: click Start Voice Mode again, then speak (keeps audio unlocked)."
                    : `Voice failed (${playMsg}). Check speakers and that Edge TTS / API is reachable.`
                );
              }
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Edge TTS failed";
            try {
              await speakWithBrowserTTS(speakText);
              finish();
            } catch {
              failAndFinish(msg);
            }
          }
        })();
      }),
    [setVoiceError]
  );

  useEffect(() => {
    setAssistantTtsPlayer(playAssistantTts);
    return () => setAssistantTtsPlayer(null);
  }, [playAssistantTts, setAssistantTtsPlayer]);

  /**
   * Process a final transcript: send to API; chat UI shows typing + typewriter + parallel TTS.
   */
  const processTranscript = useCallback(
    (transcript: string) => {
      if (!transcript.trim() || !isActiveRef.current) return;

      isProcessingOrSpeakingRef.current = true;
      stopRecognitionOnly();
      setVoiceTranscript(transcript);
      setVoiceStatus("processing");
      setListening(false);

      sendVoiceMessage(transcript)
        .then(() => {
          if (!isActiveRef.current) {
            isProcessingOrSpeakingRef.current = false;
            return;
          }
          isProcessingOrSpeakingRef.current = false;
          setVoiceTranscript("");
          setVoiceError(null);
          if (isActiveRef.current) {
            setVoiceStatus("listening");
            setListening(true);
            startListeningRef.current?.();
          }
        })
        .catch((err) => {
          isProcessingOrSpeakingRef.current = false;
          setVoiceError(err instanceof Error ? err.message : "API request failed");
          setSpeaking(false);
          if (isActiveRef.current) {
            setVoiceStatus("listening");
            setListening(true);
            startListeningRef.current?.();
          }
        });
    },
    [sendVoiceMessage, setVoiceStatus, setListening, setSpeaking, setVoiceTranscript, setVoiceError, stopRecognitionOnly]
  );

  /** Start listening via Web Speech API. Use continuous mode so we only start() once (user gesture). */
  const startListening = useCallback(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition || !isActiveRef.current) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isProcessingOrSpeakingRef.current) return;

      const result = event.results[event.resultIndex];
      if (!result) return;

      const transcript = result[0]?.transcript?.trim() ?? "";
      setVoiceTranscript(transcript || "");

      if (transcript && result.isFinal) {
        processTranscript(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const err = event.error;
      if (err === "not-allowed") {
        setVoiceError("Microphone permission denied. Please allow microphone access.");
        setVoiceModeActive(false);
        isActiveRef.current = false;
        return;
      }
      if (err === "aborted") return;
      if (err === "no-speech") {
        setVoiceTranscript("");
        if (isActiveRef.current) {
          setVoiceStatus("listening");
          setListening(true);
        }
        return;
      }
      setVoiceError(`Speech recognition error: ${err}`);
      if (isActiveRef.current) {
        setVoiceStatus("listening");
        setListening(true);
      }
    };

    recognition.onend = () => {
      if (!isActiveRef.current) return;
      if (isProcessingOrSpeakingRef.current) return;
      // Session ended but ref may still point at this instance — clear so we can start fresh.
      recognitionRef.current = null;
      setVoiceStatus("listening");
      setListening(true);
      setTimeout(() => {
        if (!isActiveRef.current) return;
        startListeningRef.current?.();
      }, 100);
    };

    recognition.onnomatch = () => {
      setVoiceTranscript("");
      if (isActiveRef.current) {
        setVoiceStatus("listening");
        setListening(true);
      }
    };

    setVoiceStatus("listening");
    setListening(true);
    setVoiceError(null);
    setVoiceTranscript("");
    try {
      recognition.start();
    } catch (e) {
      setVoiceError("Could not start speech recognition.");
      setVoiceModeActive(false);
      isActiveRef.current = false;
    }
  }, [
    processTranscript,
    setVoiceModeActive,
    setListening,
    setSpeaking,
    setVoiceTranscript,
    setVoiceError,
    setVoiceStatus,
  ]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  /** Start Voice Mode – begins the continuous listen loop */
  const handleStartVoiceMode = useCallback(() => {
    if (!isSpeechSupported()) {
      setVoiceError("Voice mode is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    unlockAudioOutput();
    isActiveRef.current = true;
    setVoiceModeActive(true);
    setVoiceError(null);
    startListening();
  }, [setVoiceModeActive, setVoiceError, startListening]);

  /** Stop Voice Mode – cleanup and exit loop */
  const handleStopVoiceMode = useCallback(() => {
    isActiveRef.current = false;
    setVoiceModeActive(false);
    setListening(false);
    setSpeaking(false);
    setVoiceTranscript("");
    setVoiceError(null);
    setVoiceStatus("off");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    ttsAudioRef.current?.pause();
    ttsAudioRef.current = null;
    if (ttsObjectUrlRef.current) {
      URL.revokeObjectURL(ttsObjectUrlRef.current);
      ttsObjectUrlRef.current = null;
    }
  }, [
    setVoiceModeActive,
    setListening,
    setSpeaking,
    setVoiceTranscript,
    setVoiceError,
    setVoiceStatus,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
      ttsAudioRef.current?.pause();
      if (ttsObjectUrlRef.current) {
        URL.revokeObjectURL(ttsObjectUrlRef.current);
        ttsObjectUrlRef.current = null;
      }
    };
  }, []);

  if (!isSpeechSupported()) {
    return (
      <div className="rounded-lg border border-border/50 bg-card/40 p-3 text-sm text-muted-foreground">
        Voice mode requires a supported browser (Chrome, Edge, or Safari).
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    off: "Voice Mode Off",
    listening: "Listening...",
    processing: "Processing request…",
    speaking: "Assistant speaking…",
  };

  return (
    <div className="glass rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Microphone icon with glow when active */}
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full transition-all",
              isVoiceModeActive && voiceStatus === "listening" && "bg-primary/20 animate-voice-glow",
              isVoiceModeActive && voiceStatus === "speaking" && "bg-primary/10"
            )}
          >
            {isVoiceModeActive ? (
              <Mic className={cn("w-5 h-5", voiceStatus === "listening" ? "text-primary animate-voice-pulse" : "text-primary")} />
            ) : (
              <MicOff className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{statusLabels[voiceStatus] ?? "Voice Mode Off"}</p>
            {voiceTranscript && (
              <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={voiceTranscript}>
                &ldquo;{voiceTranscript}&rdquo;
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isVoiceModeActive ? (
            <Button
              onClick={handleStartVoiceMode}
              variant="default"
              size="sm"
              className="gap-1.5"
              aria-label="Start Voice Mode"
            >
              <Mic className="w-4 h-4" />
              Start Voice Mode
            </Button>
          ) : (
            <Button
              onClick={handleStopVoiceMode}
              variant="destructive"
              size="sm"
              className="gap-1.5"
              aria-label="Stop Voice Mode"
            >
              <MicOff className="w-4 h-4" />
              Stop Voice Mode
            </Button>
          )}
        </div>
      </div>

      {/* Wave animation when listening */}
      {isVoiceModeActive && voiceStatus === "listening" && (
        <div className="flex items-center justify-center gap-1 h-6" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1 bg-primary rounded-full animate-voice-wave"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {/* Processing indicator */}
      {voiceStatus === "processing" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          Processing request…
        </div>
      )}

      {/* Speaking indicator */}
      {voiceStatus === "speaking" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Volume2 className="w-4 h-4 text-primary" />
          Assistant speaking…
        </div>
      )}

      {/* Error message */}
      {voiceError && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2" role="alert">
          {voiceError}
        </div>
      )}
    </div>
  );
}
