export interface MathExpr {
  /** Expressão normalizada para exibição no card ("5 + 8", "2 × (3 + 4)"). */
  display: string;
  result: number;
}

type Token =
  | { kind: "num"; value: number; raw: string }
  | { kind: "op"; value: "+" | "-" | "×" | "÷" | "^" }
  | { kind: "open" }
  | { kind: "close" };

const OP_ALIASES: Record<string, "+" | "-" | "×" | "÷" | "^"> = {
  "+": "+",
  "-": "-",
  "−": "-",
  "–": "-",
  "*": "×",
  x: "×",
  X: "×",
  "×": "×",
  "/": "÷",
  ":": "÷",
  "÷": "÷",
  "^": "^"
};

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === "\t") {
      i++;
      continue;
    }
    if (ch >= "0" && ch <= "9") {
      let j = i;
      while (j < input.length && /[0-9]/.test(input[j])) j++;
      if (input[j] === "." || input[j] === ",") {
        j++;
        while (j < input.length && /[0-9]/.test(input[j])) j++;
      }
      const raw = input.slice(i, j);
      const value = Number(raw.replace(",", "."));
      if (!Number.isFinite(value)) return null;
      tokens.push({ kind: "num", value, raw });
      i = j;
      continue;
    }
    if (ch === "(" || ch === "[") {
      tokens.push({ kind: "open" });
      i++;
      continue;
    }
    if (ch === ")" || ch === "]") {
      tokens.push({ kind: "close" });
      i++;
      continue;
    }
    const op = OP_ALIASES[ch];
    if (op) {
      tokens.push({ kind: "op", value: op });
      i++;
      continue;
    }
    return null;
  }
  return tokens.length > 0 ? tokens : null;
}

/**
 * Avaliador recursivo de expressões aritméticas.
 * Gramática: soma → produto → unário → potência → primário (número ou parênteses).
 */
class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): number | null {
    const value = this.sum();
    if (value === null || this.pos !== this.tokens.length) return null;
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private sum(): number | null {
    let left = this.product();
    if (left === null) return null;
    for (;;) {
      const t = this.peek();
      if (t?.kind !== "op" || (t.value !== "+" && t.value !== "-")) return left;
      this.pos++;
      const right = this.product();
      if (right === null) return null;
      left = t.value === "+" ? left + right : left - right;
    }
  }

  private product(): number | null {
    let left = this.unary();
    if (left === null) return null;
    for (;;) {
      const t = this.peek();
      if (t?.kind !== "op" || (t.value !== "×" && t.value !== "÷")) return left;
      this.pos++;
      const right = this.unary();
      if (right === null) return null;
      if (t.value === "÷" && right === 0) return null;
      left = t.value === "×" ? left * right : left / right;
    }
  }

  private unary(): number | null {
    const t = this.peek();
    if (t?.kind === "op" && (t.value === "-" || t.value === "+")) {
      this.pos++;
      const value = this.unary();
      if (value === null) return null;
      return t.value === "-" ? -value : value;
    }
    return this.power();
  }

  private power(): number | null {
    const base = this.primary();
    if (base === null) return null;
    const t = this.peek();
    if (t?.kind === "op" && t.value === "^") {
      this.pos++;
      const exp = this.unary();
      if (exp === null) return null;
      return base ** exp;
    }
    return base;
  }

  private primary(): number | null {
    const t = this.peek();
    if (!t) return null;
    if (t.kind === "num") {
      this.pos++;
      return t.value;
    }
    if (t.kind === "open") {
      this.pos++;
      const value = this.sum();
      if (value === null) return null;
      if (this.peek()?.kind !== "close") return null;
      this.pos++;
      return value;
    }
    return null;
  }
}

function displayFrom(tokens: Token[]): string {
  let out = "";
  tokens.forEach((t, i) => {
    const prev = tokens[i - 1];
    if (t.kind === "num") {
      const glued = prev?.kind === "open" || (prev?.kind === "op" && isUnaryAt(tokens, i - 1));
      out += (out && !glued ? " " : "") + t.raw;
    } else if (t.kind === "op") {
      if (isUnaryAt(tokens, i)) out += (out && !out.endsWith("(") ? " " : "") + t.value;
      else out += ` ${t.value}`;
    } else if (t.kind === "open") {
      out += (out && !out.endsWith("(") ? " " : "") + "(";
    } else {
      out += ")";
    }
  });
  return out.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();
}

/** Um operador é unário quando abre a expressão ou vem logo depois de outro operador / parêntese aberto. */
function isUnaryAt(tokens: Token[], index: number): boolean {
  const t = tokens[index];
  if (!t || t.kind !== "op") return false;
  const prev = tokens[index - 1];
  return !prev || prev.kind === "op" || prev.kind === "open";
}

/** Interpreta qualquer expressão aritmética ("5+8", "2 × (3 + 4)"). Retorna null se não for válida. */
export function parseMath(input: string): MathExpr | null {
  const tokens = tokenize(input ?? "");
  if (!tokens) return null;
  const result = new Parser(tokens).parse();
  if (result === null || !Number.isFinite(result)) return null;
  return {
    display: displayFrom(tokens),
    result
  };
}

/** Resultado formatado em pt-BR, com no máximo 4 casas decimais. */
export function formatResult(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(value);
}
