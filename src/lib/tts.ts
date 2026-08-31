const voiceCache = new Map<string, SpeechSynthesisVoice | null>();
const listeners = new Set<() => void>();

function findVoice(lang: string): SpeechSynthesisVoice | null {
  const key = lang.toLowerCase();
  if (voiceCache.has(key)) return voiceCache.get(key) ?? null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const prefix = key.split("-")[0];
  const match =
    voices.find((v) => v.lang.toLowerCase().replace("_", "-") === key) ??
    voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(prefix)) ??
    null;
  voiceCache.set(key, match);
  return match;
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Indica se o aparelho tem voz instalada para o idioma. Sem voz do idioma certo
 * o navegador lê o texto com a voz padrão (em inglês, no Windows), o que atrapalha
 * mais do que ajuda — então a fala é desligada nesse caso.
 */
export function hasVoiceFor(lang: string): boolean {
  if (!ttsSupported()) return false;
  return findVoice(lang) !== null;
}

/** Avisa quando a lista de vozes do navegador muda (ela chega de forma assíncrona). */
export function subscribeVoices(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Fala o texto em voz alta. Retorna false se não houver voz para o idioma pedido. */
export function speak(text: string, lang = "en-US"): boolean {
  if (!text.trim() || !ttsSupported()) return false;
  const voice = findVoice(lang);
  if (!voice) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  utterance.voice = voice;
  synth.speak(utterance);
  return true;
}

// As vozes chegam de forma assíncrona no Chrome; força o carregamento cedo.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    voiceCache.clear();
    listeners.forEach((fn) => fn());
  });
}
