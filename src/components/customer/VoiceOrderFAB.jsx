import React, { useState } from "react";
import { Mic } from "lucide-react";

/**
 * Uses Web Speech API where available. Pass onTranscript to react to raw text
 * (e.g. fill search or navigate).
 */
export default function VoiceOrderFAB({ onTranscript, className = "" }) {
  const [listening, setListening] = useState(false);

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      window.alert("Voice ordering is not supported in this browser. Try Chrome on Android or desktop.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      onTranscript?.(text);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={listening ? undefined : start}
      className={`fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-primary-200 bg-white text-primary-700 shadow-lg transition active:scale-95 ${listening ? "animate-pulse ring-2 ring-primary-400" : ""} ${className}`}
      aria-label="Voice order"
      title="Tap and say what you want, e.g. one chicken burger and coke"
    >
      <Mic size={22} />
    </button>
  );
}
