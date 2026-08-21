let cachedVoice: SpeechSynthesisVoice | null = null;
let cachedLang = "";

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (cachedVoice && cachedLang === lang) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const prefix = lang.split("-")[0].toLowerCase();
  const match =
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (match) {
    cachedVoice = match;
    cachedLang = lang;
  }
  return match ?? null;
}

/** Fala o texto em voz alta usando a Web Speech API. Silencioso se não houver suporte. */
export function speak(text: string, lang = "en-US"): void {
  if (!text.trim()) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// As vozes chegam de forma assíncrona no Chrome; força o carregamento cedo.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    cachedVoice = null;
    cachedLang = "";
  });
}
