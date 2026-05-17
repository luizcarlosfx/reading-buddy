import { useEffect, useState } from "react";
import { getCurrentUser, setCurrentUser, subscribeUser } from "../lib/auth";
import { isApiConfigured } from "../lib/api";

export default function UserGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(getCurrentUser());

  useEffect(() => subscribeUser(setUser), []);

  if (!isApiConfigured()) {
    return (
      <div className="card p-8 max-w-xl mx-auto text-center space-y-3">
        <h1 className="text-xl font-bold">API não configurada</h1>
        <p className="text-slate-600 text-sm">
          Defina <code>VITE_API_URL</code> no <code>.env.local</code> ou no
          workflow de deploy antes de usar o app.
        </p>
      </div>
    );
  }

  if (!user) return <LoginCard />;

  return <>{children}</>;
}

function LoginCard() {
  const [name, setName] = useState("");

  function handleEnter() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCurrentUser(trimmed);
  }

  return (
    <div className="card p-8 max-w-md mx-auto space-y-4">
      <div className="text-center space-y-1">
        <div className="text-5xl">📚</div>
        <h1 className="text-2xl font-extrabold">Leitura do Tobias</h1>
        <p className="text-sm text-slate-500">
          Digite um nome pra acessar suas atividades. Pode ser qualquer coisa —
          cada nome tem suas próprias atividades.
        </p>
      </div>
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Seu nome</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEnter();
          }}
          placeholder="Ex.: Luiz"
          autoFocus
          className="input mt-1"
        />
      </label>
      <button
        onClick={handleEnter}
        disabled={!name.trim()}
        className="btn-primary w-full disabled:opacity-50"
      >
        Entrar
      </button>
    </div>
  );
}
