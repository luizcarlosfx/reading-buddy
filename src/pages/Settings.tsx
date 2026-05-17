import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  exportJSON,
  getPixabayKey,
  importJSON,
  setPixabayKey
} from "../lib/storage";
import { clearCurrentUser, getCurrentUser, subscribeUser } from "../lib/auth";

export default function Settings() {
  const envKey = (import.meta.env.VITE_PIXABAY_KEY as string | undefined) ?? "";
  const fromEnv = Boolean(envKey.trim());
  const [key, setKey] = useState(fromEnv ? "" : getPixabayKey());
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<string | null>(getCurrentUser());

  useEffect(() => subscribeUser(setUser), []);

  function handleSave() {
    setPixabayKey(key);
    setSavedMsg("Chave salva!");
    setTimeout(() => setSavedMsg(null), 2000);
  }

  async function handleExport() {
    setBusy(true);
    try {
      const json = await exportJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `reading-buddy-${user ?? "export"}-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Erro ao exportar: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const result = await importJSON(String(reader.result ?? ""));
      if (result.ok) {
        setImportMsg(`Importadas ${result.count} atividades.`);
      } else {
        setImportMsg(`Erro: ${result.error}`);
      }
      setBusy(false);
      setTimeout(() => setImportMsg(null), 4000);
    };
    reader.onerror = () => {
      setImportMsg("Erro ao ler o arquivo.");
      setBusy(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleSwitchUser() {
    if (!confirm("Sair e trocar de usuário?")) return;
    clearCurrentUser();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/" className="btn-ghost">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-extrabold">Configurações</h1>
      </div>

      <section className="card p-5 space-y-3">
        <div>
          <h2 className="text-lg font-bold">Usuário</h2>
          <p className="text-sm text-slate-500">
            Cada nome tem suas próprias atividades. Pra acessar as de outra
            pessoa, troque pro nome dela.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm">
            Entrado como{" "}
            <span className="font-bold text-brand-700">{user ?? "—"}</span>
          </div>
          <button onClick={handleSwitchUser} className="btn-secondary text-sm">
            Trocar usuário
          </button>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Chave da Pixabay</h2>
          <p className="text-sm text-slate-500">
            Necessária para buscar imagens. Obtenha em{" "}
            <a
              href="https://pixabay.com/api/docs/"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              pixabay.com/api/docs
            </a>
            .
          </p>
        </div>

        {fromEnv ? (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-sm">
            ✓ Chave carregada do arquivo <code>.env.local</code>.
          </div>
        ) : (
          <>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="55701439-..."
              className="input font-mono text-sm"
            />
            <div className="flex items-center gap-3">
              <button onClick={handleSave} className="btn-primary">
                Salvar chave
              </button>
              {savedMsg && <span className="text-sm text-emerald-700">{savedMsg}</span>}
            </div>
          </>
        )}
      </section>

      <section className="card p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold">Backup de atividades</h2>
          <p className="text-sm text-slate-500">
            Exporta/importa as atividades do usuário atual ({user ?? "—"}).
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} disabled={busy} className="btn-secondary disabled:opacity-60">
            📥 Exportar JSON
          </button>
          <label className={`btn-secondary cursor-pointer ${busy ? "opacity-60 pointer-events-none" : ""}`}>
            📤 Importar JSON
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
              disabled={busy}
            />
          </label>
        </div>
        {importMsg && <p className="text-sm text-slate-600">{importMsg}</p>}
        <p className="text-xs text-slate-400">
          Importar adiciona/atualiza atividades; não apaga as existentes.
        </p>
      </section>
    </div>
  );
}
