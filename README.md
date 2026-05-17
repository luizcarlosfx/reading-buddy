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

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS 3
- React Router (HashRouter, so the app works under a GitHub Pages subpath)
- Persistence: `localStorage` (no backend, no login)
- Hosting: GitHub Pages via GitHub Actions

## Running locally

```bash
npm install
cp .env.example .env.local
# fill VITE_PIXABAY_KEY with your Pixabay API key
npm run dev
```

Opens at http://localhost:5173.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.

The Pixabay key must be set as a repo secret named `VITE_PIXABAY_KEY` (Settings → Secrets and variables → Actions).
