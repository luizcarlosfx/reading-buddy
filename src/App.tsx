import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import EditActivity from "./pages/EditActivity";
import PlayActivity from "./pages/PlayActivity";
import Settings from "./pages/Settings";
import UserGate from "./components/UserGate";
import { clearCurrentUser, getCurrentUser, subscribeUser } from "./lib/auth";

export default function App() {
  const [user, setUser] = useState<string | null>(getCurrentUser());

  useEffect(() => subscribeUser(setUser), []);

  function handleSwitchUser() {
    if (!confirm("Sair e trocar de usuário?")) return;
    clearCurrentUser();
  }

  return (
    <div className="min-h-full">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white grid place-items-center font-black text-xl flex-shrink-0">
              T
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-lg leading-tight truncate">
                Leitura do Tobias
              </div>
              <div className="text-xs text-slate-500 truncate">
                Atividades de leitura
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            {user && (
              <button
                onClick={handleSwitchUser}
                className="btn-ghost text-sm flex items-center gap-2"
                title="Trocar usuário"
              >
                <span className="hidden sm:inline">👤</span>
                <span className="font-bold">{user}</span>
              </button>
            )}
            <Link to="/configuracoes" className="btn-ghost text-sm">
              Configurações
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <UserGate>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/atividade/nova" element={<EditActivity />} />
            <Route path="/atividade/:id/editar" element={<EditActivity />} />
            <Route path="/atividade/:id/jogar" element={<PlayActivity />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Routes>
        </UserGate>
      </main>
    </div>
  );
}
