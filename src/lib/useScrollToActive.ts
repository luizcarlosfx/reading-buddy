import { useEffect, useRef } from "react";

/**
 * Mantém o card da vez visível. Com muitos cards na grade o ativo pode estar
 * fora da tela, e aí a contagem correria sem ele ver.
 */
export function useScrollToActive(activeIndex: number, enabled: boolean) {
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!enabled || activeIndex < 0) return;
    refs.current[activeIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [enabled, activeIndex]);

  return refs;
}
