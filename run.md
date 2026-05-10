# LeetTrack — How to run

## 1. Add your Gemini API key (optional but recommended)
Edit `server/.env` and replace `your_gemini_api_key_here` with your key from https://aistudio.google.com

## 2. Start the backend (Terminal 1)
```bash
cd server
npm run dev
# Runs on http://localhost:3001
fuser -k 3001/tcp

```

## 3. Start the frontend (Terminal 2)
```bash
cd client
npm run dev
# Runs on http://localhost:5173
fuser -k 3001/tcp 5173/tcp

```

Open http://localhost:5173 in your browser.

## Without an API key
The app works fully without a Gemini key — LLM analysis will be skipped when no key is present.
Score will be computed from hints only. You can add the key later at any time.