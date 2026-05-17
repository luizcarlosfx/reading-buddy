import { useLayoutEffect, useRef } from "react";

interface Props {
  children: string;
  max?: number;
  min?: number;
  className?: string;
}

export default function FitText({ children, max = 160, min = 16, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    function fit() {
      const wrap = wrapRef.current;
      const text = textRef.current;
      if (!wrap || !text) return;

      text.style.fontSize = `${max}px`;
      const wrapW = wrap.clientWidth;
      const wrapH = wrap.clientHeight;
      const naturalW = text.scrollWidth;
      const naturalH = text.scrollHeight;
      if (naturalW === 0 || naturalH === 0 || wrapW === 0 || wrapH === 0) return;

      const ratio = Math.min(1, wrapW / naturalW, wrapH / naturalH);
      const next = Math.max(min, Math.floor(max * ratio));
      text.style.fontSize = `${next}px`;
    }

    fit();
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [children, max, min]);

  return (
    <div
      ref={wrapRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
    >
      <span
        ref={textRef}
        className={className}
        style={{ lineHeight: 1, whiteSpace: "nowrap" }}
      >
        {children}
      </span>
    </div>
  );
}
