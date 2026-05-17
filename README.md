# reading-buddy

A small web app I built to help my son **Tobias** learn to read. It's a card-based learning tool: each card has a word and an image, and you can play it in two modes — flip the card or type the word.

Built collaboratively with **Claude Code** (Anthropic), as a pair-programming experiment with AI to solve a real, everyday problem.

**Live demo:** https://luizcarlosfx.github.io/reading-buddy/

> The UI is in Brazilian Portuguese (pt-BR) because that's the language my son is learning to read in.

## How it works

- You build **activities** — lists of cards. Each card has a word and an image.
- At play time, you can switch between two modes on the fly:
  - **Virar (Flip):** the child sees the word, taps the card to reveal the image.
  - **Escrever (Type):** the child sees the image and types the word; the app validates with tolerance for accents and casing.
- Other runtime controls: shuffle (on by default) and a card-count limit (All / 10 / 8 / 6). Each activity remembers its last-used settings.
- Images come from the [Pixabay API](https://pixabay.com/api/docs/), with automatic PT→EN translation to get better search results.
- Backup: export/import JSON from the Settings page.

## Profiles (no real auth)

On first visit you type a **name** to use as a profile. The name is stored in your browser's `localStorage` and sent to the API on every request as an `X-User` header.

- Each name has its own activity list. Sister can use her name and have her own cards; switching to my name shows my cards.
- This isn't real authentication — anyone who knows a name can use it. The point is just to let multiple people share the app without conflicts. Good enough for family scope.
- Use **Configurações → Trocar usuário** to log out and pick another name.

## Stack

**Frontend** (this repo, GitHub Pages):
- Vite + React 18 + TypeScript
- Tailwind CSS 3
- React Router (HashRouter, so the app works under a GitHub Pages subpath)

**API** (Cloudflare Workers + D1):
- Live at https://reading-buddy-api.luizcarlos-sfx.workers.dev
- Worker source lives in [`api/`](./api/)
- D1 (managed SQLite) for activity storage, scoped per user name

## Running locally

```bash
npm install
cp .env.example .env.local
# fill .env.local:
#   VITE_PIXABAY_KEY=<your Pixabay key>
#   VITE_API_URL=https://reading-buddy-api.luizcarlos-sfx.workers.dev
npm run dev
```

Opens at http://localhost:5173.

## Deploy

**Frontend** — pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages. Required repo config:
- Secret `VITE_PIXABAY_KEY` (Pixabay API key)
- Variable `VITE_API_URL` (Worker URL)

**API** — from `api/`:
```bash
npx wrangler deploy
```
The D1 binding and schema are configured in `api/wrangler.toml` and `api/schema.sql`.
