import { useEffect, useState } from "react";
import { hasVoiceFor, subscribeVoices } from "./tts";

/** Acompanha se existe voz instalada para o idioma; reavalia quando o navegador carrega a lista. */
export function useVoiceAvailable(lang: string): boolean {
  const [available, setAvailable] = useState(() => hasVoiceFor(lang));

  useEffect(() => {
    setAvailable(hasVoiceFor(lang));
    return subscribeVoices(() => setAvailable(hasVoiceFor(lang)));
  }, [lang]);

  return available;
}
