import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import EditActivity from "./pages/EditActivity";
import PlayActivity from "./pages/PlayActivity";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <div className="min-h-full">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white grid place-items-center font-black text-xl">
              T
            </div>
            <div>
              <div className="font-extrabold text-lg leading-tight">Leitura do Tobias</div>
              <div className="text-xs text-slate-500">Atividades de leitura</div>
            </div>
          </Link>
          <Link to="/configuracoes" className="btn-ghost text-sm">
            Configurações
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/atividade/nova" element={<EditActivity />} />
          <Route path="/atividade/:id/editar" element={<EditActivity />} />
          <Route path="/atividade/:id/jogar" element={<PlayActivity />} />
          <Route path="/configuracoes" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
