# Orbit Study Tutor

Orbit is an agentic AI study companion for learners who want a calmer, more adaptive way to plan revision, ask questions, and build momentum. It includes a dashboard, a conversational tutor, adaptive study suggestions, a quick quiz loop, streaks, and progress tracking.

## Run locally

```bash
npm install
npm run dev:full
```

Open `http://localhost:5173`. The full command starts both the Vite frontend and the local AI server.

## Build for deployment

```bash
npm run build
```

The production files are generated in `dist/` and can be deployed to Vercel, Netlify, GitHub Pages, or any static host.

## Connect a real AI provider

Copy `.env.example` to `.env`, then set `GEMINI_API_KEY` or `OPENAI_API_KEY`. Orbit sends every question to `server/index.js`, which calls the configured provider and returns a tutor answer. Gemini is used first when both are configured. Keep `.env` private and never commit it.

For a deployment, deploy the Vite frontend and the `server/` API separately, then point the frontend `/api` route at the server. Without an API key, the app remains usable in offline demo mode for the built-in study topics, but a real model is required to answer arbitrary questions.

## Product notes

- Demo mode works offline with a local tutor fallback.
- Learner messages, streak, and completion count persist in `localStorage`.
- The quiz agent creates a fresh question set from the active lesson.
- The UI is responsive and optimized for desktop and mobile study sessions.
