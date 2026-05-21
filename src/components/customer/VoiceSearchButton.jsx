import React, { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";

/**
 * Inline microphone button designed to sit inside a search input.
 *
 * Uses the browser Web Speech API where available. When the user taps the
 * mic, recognition starts; when speech is captured we call `onTranscript`
 * with the raw text so the parent can drive its own search state. The button
 * shows a soft animated wave while listening so the customer gets clear
 * visual feedback that the mic is hot.
 *
 * If the API isn't supported (e.g. Safari < 14.1, Firefox) the button hides
 * itself entirely rather than render a non-working control.
 */
export default function VoiceSearchButton({
  onTranscript,
  lang = "en-US",
  className = "",
  ariaLabel = "Voice search",
}) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef(null);

  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setSupported(false);
      return;
    }
    return () => {
      try {
        recognizerRef.current?.stop?.();
      } catch {
        /* noop */
      }
    };
  }, []);

  const toggleVoiceSearch = () => {
    if (listening) {
      try {
        recognizerRef.current?.stop?.();
      } catch {
        /* noop */
      }
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      onTranscript?.(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognizerRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  if (!supported) return null;

  return (
    <LazyMotion features={domAnimation}>
    <m.button
      type="button"
      onClick={toggleVoiceSearch}
      whileTap={{ scale: 0.88 }}
      aria-label={ariaLabel}
      aria-pressed={listening}
      title={listening ? "Tap to stop" : "Tap and say what you want"}
      className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
        listening
          ? "bg-primary-600 text-white"
          : "bg-white text-primary-700 ring-1 ring-primary-100 hover:bg-primary-50"
      } ${className}`}
    >
      <AnimatePresence>
        {listening && (
          <>
            <m.span
              key="ring-1"
              aria-hidden
              initial={{ scale: 0.7, opacity: 0.5 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-lg bg-primary-500/60"
            />
            <m.span
              key="ring-2"
              aria-hidden
              initial={{ scale: 0.7, opacity: 0.35 }}
              animate={{ scale: 2.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.3,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.25,
              }}
              className="absolute inset-0 rounded-lg bg-primary-400/40"
            />
          </>
        )}
      </AnimatePresence>
      <Mic
        size={14}
        strokeWidth={listening ? 2.5 : 2}
        className="relative z-10"
      />
    </m.button>
    </LazyMotion>
  );
}
