# Scam Drill

A practice app for spotting Indian digital-payment scams: a phone simulator drill,
a message checker that scores any suspicious SMS, a Learn section and an
"it happened, do this now" Help screen.

Plain HTML, CSS and JavaScript. No framework, no build step, no accounts, no
analytics, no cloud services.

## Run it

### Option 1: just open the file

Double-click `index.html`, or open it in a browser. Everything works from
`file://`. The drill uses the 12 bundled scenarios.

### Option 2: local server (needed for the Ollama integration)

Requires Node 18 or newer. There are no dependencies to install.

```bash
node tools/serve.js
```

Then open <http://localhost:8080>.

The server serves the app and proxies `POST /api/ollama/chat` to the Ollama
instance on the same machine. Change the port or the Ollama address if needed:

```bash
PORT=8081 OLLAMA_URL=http://127.0.0.1:11434/api/chat node tools/serve.js
```

## Optional AI drill scenarios (Ollama)

Every new drill asks the local model for ten fresh scenarios. If that is not
possible, the app quietly plays the built-in set instead, so the drill never
waits on AI to work.

1. Install Ollama from <https://ollama.com> and pull the model:

   ```bash
   ollama pull qwen2.5-coder:7b
   ```

2. Make sure Ollama is running (`ollama serve`, or the desktop app).
3. Start this app with `node tools/serve.js` and open <http://localhost:8080>.
4. Go to Drill and press **Begin**. The app asks Ollama for ten scenarios, shows
   each one as it is written, and lets you switch to the built-in set at any moment.

Generating ten scenarios with a 7B model takes a few minutes on a laptop. The
request is capped at six minutes by default. If it times out, any complete
scenarios that already arrived are still used and the rest come from the built-in
set, so a slow machine never leaves you with nothing to play.

### If you open `index.html` directly

The browser then talks to `http://localhost:11434` itself, which Ollama blocks
unless its origin list allows it. Either use the local server above (recommended)
or start Ollama with a permissive origin list for local practice:

```bash
OLLAMA_ORIGINS=* ollama serve
```

### Settings you can change in the browser console

```js
window.SCAM_DRILL_AI = false;          // skip AI entirely, use bundled scenarios
window.SCAM_DRILL_AI_TIMEOUT = 600000; // milliseconds, default 360000 (6 minutes)
window.SCAM_DRILL_MODEL = 'qwen2.5-coder:7b'; // another installed model
```

Set these before starting a drill (they are read when a session begins).

### How generated scenarios are handled

- The model reply is parsed as JSON and every field is checked: title, context,
  messages, exactly four choices with exactly one "best" answer, feedback, flags,
  lesson, golden rule and difficulty.
- Flag phrases must exist in a message, and are stored with the message's real
  wording so the yellow marker always lands on them.
- Anything naming a real bank, payment app, brand, government portal or toll-free
  number is rejected, as are invented helpline numbers.
- Accepted scenarios are shuffled, answer choices are shuffled, and any shortfall
  is topped up from the bundled set. A model failure of any kind returns the
  bundled set.
- The reply is read as a stream, so progress is visible while the model writes and
  complete scenarios survive a timeout or a reply that was cut off.
- Generated text is inserted with text nodes only, never as HTML.

All model content is untrusted data. It is for practice, not advice.

## Project layout

```
index.html            the five views, top bar, bottom tab bar
css/styles.css        design tokens, components, responsive rules
js/app.js             helpers, icons, storage, theme, router, phone mock
js/game.js            drill phases, scoring, feedback, results, badges, Ollama
js/checker-ui.js      message checker screen
js/help-learn.js      Learn and Help screens
data/scenarios.js     the 12 bundled scenarios (provided)
data/checker-rules.js the checker engine (provided)
data/learn-data.js    Learn and Help content (provided)
tools/serve.js        optional local server and Ollama proxy
```

The three files in `data/` are loaded with plain `<script>` tags and are not
modified by the app.

## Notes

- Best score, theme, earned badges and the Help checklist live in `localStorage`
  under keys prefixed `scamdrill.`. Every read and write is wrapped in
  `try/catch`, so the app still works when storage is blocked.
- Pasted messages stay in memory. They are never stored or sent anywhere.
- Everything is keyboard operable (A to D or 1 to 4 answer the drill), the focus
  ring is always visible, and `prefers-reduced-motion` is respected.
- Helpline 1930 and the reporting portals in Help are the real national services.
  The scenario bank and generated content are fictional.
