export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
}

interface ActivityBody {
  name?: string;
  kind?: string;
  cards?: unknown;
  createdAt?: number;
}

interface ActivityRow {
  id: string;
  user_name: string;
  name: string;
  kind: string;
  cards: string;
  created_at: number;
  updated_at: number;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}

function rowToActivity(row: ActivityRow) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    cards: JSON.parse(row.cards ?? "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") ?? "";
    const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
    const allowOrigin = allowed.includes(origin) ? origin : allowed[0];
    const cors = corsHeaders(allowOrigin);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const user = (req.headers.get("X-User") ?? "").trim();
    if (!user) {
      return json({ error: "Usuário não definido" }, 401, cors);
    }

    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (parts[0] !== "activities") {
      return json({ error: "Not found" }, 404, cors);
    }

    const id = parts[1];

    try {
      if (req.method === "GET" && !id) {
        const { results } = await env.DB.prepare(
          "SELECT id, user_name, name, kind, cards, created_at, updated_at FROM activities WHERE user_name = ? ORDER BY updated_at DESC"
        )
          .bind(user)
          .all<ActivityRow>();
        return json(results.map(rowToActivity), 200, cors);
      }

      if (req.method === "GET" && id) {
        const row = await env.DB.prepare(
          "SELECT id, user_name, name, kind, cards, created_at, updated_at FROM activities WHERE id = ? AND user_name = ?"
        )
          .bind(id, user)
          .first<ActivityRow>();
        if (!row) return json({ error: "Not found" }, 404, cors);
        return json(rowToActivity(row), 200, cors);
      }

      if (req.method === "PUT" && id) {
        const body = (await req.json()) as ActivityBody;
        if (!body?.name || !body?.kind || !Array.isArray(body.cards)) {
          return json({ error: "Corpo inválido" }, 400, cors);
        }
        const existing = await env.DB.prepare(
          "SELECT user_name, created_at FROM activities WHERE id = ?"
        )
          .bind(id)
          .first<{ user_name: string; created_at: number }>();

        if (existing && existing.user_name !== user) {
          return json({ error: "Atividade pertence a outro usuário" }, 403, cors);
        }

        const now = Date.now();
        const createdAt = existing?.created_at ?? body.createdAt ?? now;

        await env.DB.prepare(
          `INSERT INTO activities (id, user_name, name, kind, cards, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             kind = excluded.kind,
             cards = excluded.cards,
             updated_at = excluded.updated_at`
        )
          .bind(id, user, body.name, body.kind, JSON.stringify(body.cards), createdAt, now)
          .run();

        return json({ ok: true, id, createdAt, updatedAt: now }, 200, cors);
      }

      if (req.method === "DELETE" && id) {
        const res = await env.DB.prepare(
          "DELETE FROM activities WHERE id = ? AND user_name = ?"
        )
          .bind(id, user)
          .run();
        return json({ ok: true, deleted: res.meta.changes }, 200, cors);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal error";
      return json({ error: message }, 500, cors);
    }

    return json({ error: "Method not allowed" }, 405, cors);
  }
} satisfies ExportedHandler<Env>;
