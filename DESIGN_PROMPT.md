# DESIGN PROMPT: Scam Drill

Paste everything below the line into your AI coding tool. It should read `PROJECT_SPEC.md` first, then `data/scenarios.js` and `data/checker-rules.js`, which already exist and must not be rewritten.

---

You are a senior product designer and front-end engineer. Build the interface for **Scam Drill**, a web app that trains people in India to spot digital payment scams (UPI, OTP, KYC, fake refunds, digital arrest). The app is plain HTML, CSS and vanilla JavaScript. No framework, no build step, and it must work by double-clicking `index.html`.

The design is the most important part of this project. It must look like a product made by a small, opinionated studio, not like a template. Follow every value below exactly. When a value is not given, pick the one that fits the system and stay consistent.

## 1. Design idea

**Concept: a marker pen on a bank notice.** Scams are made of phrases. The signature moment of the whole app is a yellow highlighter pen sweeping across the red-flag phrases inside a scam message, one after another. Everything else stays calm and quiet so that the yellow marker is the one loud thing on the page.

- Mood: clear, serious, a little playful. Like a very good school exercise book for adults.
- Colour does the talking: ink navy, one ultramarine for actions, marker yellow for red flags, and three signal colours (red, amber, green) used only to show scam, suspicious and safe.
- Surfaces are flat. No gradients, no glassmorphism, no glow, no stock illustrations, no emoji anywhere (use inline SVG icons, 2px stroke, round caps).
- Do not centre everything. Use left-aligned text and asymmetric two-column layouts.
- Do not use a left coloured bar on cards. Do not give every element the same radius and shadow.

## 2. Tokens (paste this block as the top of `css/styles.css`)

```css
:root {
  /* Light theme */
  --bg: #F2F4F8;
  --surface: #FFFFFF;
  --surface-2: #E8ECF3;
  --line: #D5DBE6;
  --ink: #0E1726;
  --ink-2: #4A566B;
  --accent: #2347D6;        /* actions, links, focus */
  --accent-ink: #FFFFFF;    /* text on accent */
  --accent-soft: #E3E9FC;
  --marker: #FFE14D;        /* red-flag highlighter */
  --marker-ink: #1A1400;
  --danger: #C8321B;  --danger-soft: #FBE6E1;
  --warn:   #A65F00;  --warn-soft:   #FCEBCF;
  --safe:   #0B7A55;  --safe-soft:   #DDF3EA;
  --phone-bezel: #0E1726;
  --phone-screen: #F7F8FB;
  --bubble: #E9EDF5;

  /* Type */
  --font-display: "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif;
  --font-body: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;

  /* Space (4px base) */
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px; --s9: 96px;

  /* Radius */
  --r-sm: 8px; --r-md: 14px; --r-lg: 24px; --r-phone: 44px; --r-pill: 999px;

  /* Elevation (use only on the phone and on the feedback card) */
  --shadow-1: 0 1px 2px rgba(14, 23, 38, .06);
  --shadow-2: 0 14px 36px rgba(14, 23, 38, .12);

  /* Motion */
  --ease: cubic-bezier(.2, .8, .2, 1);
  --t-fast: 150ms; --t-base: 250ms; --t-slow: 500ms;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark values below */
    --bg: #0B1020; --surface: #131A2E; --surface-2: #1B2440; --line: #263152;
    --ink: #EAEFFA; --ink-2: #9AA6C2;
    --accent: #7C97FF; --accent-ink: #0B1020; --accent-soft: #1D2850;
    --marker: #FFE14D; --marker-ink: #1A1400;
    --danger: #FF6B57; --danger-soft: #3A1A18;
    --warn: #FFB547;   --warn-soft: #3A2A10;
    --safe: #3DD598;   --safe-soft: #12362B;
    --phone-bezel: #05070F; --phone-screen: #0F1630; --bubble: #1E2845;
    --shadow-1: 0 1px 2px rgba(0, 0, 0, .4); --shadow-2: 0 14px 36px rgba(0, 0, 0, .5);
    color-scheme: dark;
  }
}
:root[data-theme="dark"] { /* repeat the exact same dark values as above */ color-scheme: dark; }
```

The app has a theme toggle in the top bar (sun/moon SVG, 40px button). Default follows the system. The choice is saved in `localStorage` (wrap in try/catch).

## 3. Typography

Load from Google Fonts with `display=swap`: **Bricolage Grotesque** (700, 800), **IBM Plex Sans** (400, 500, 600), **IBM Plex Mono** (400, 500).

| Role | Font | Size / line-height | Weight | Letter-spacing | Used for |
|---|---|---|---|---|---|
| Display XL | Display | `clamp(40px, 7vw, 76px)` / 1.02 | 800 | -0.025em | Home hero headline only |
| H1 | Display | `clamp(30px, 4.5vw, 48px)` / 1.08 | 700 | -0.02em | Page titles |
| H2 | Display | `clamp(24px, 3vw, 32px)` / 1.15 | 700 | -0.015em | Section titles |
| H3 | Body | 20px / 28px | 600 | 0 | Card titles |
| Body | Body | 16px / 26px | 400 | 0 | Paragraphs (max width 62ch) |
| Body small | Body | 14px / 22px | 400 | 0 | Help text, captions |
| Label | Body | 12px / 16px | 600 | 0.08em, UPPERCASE | Eyebrows, chips, badges |
| Message | Mono | 15px / 24px | 400 | 0 | Anything shown as a scam message or caller transcript |
| Number XL | Display | `clamp(64px, 12vw, 120px)` / 1 | 800 | -0.03em | Final score, risk score |

Rules: headings use `text-wrap: balance`. Numbers that line up use `font-variant-numeric: tabular-nums`. Body colour is `--ink`, secondary text is `--ink-2`. Never go below 12px. Never use more than two weights in one component.

## 4. Layout system

- Page max-width **1120px**, centred. Side gutter `max(16px, env(safe-area-inset-left))` and the same for right. Vertical rhythm between page sections: **96px** desktop, **64px** tablet, **48px** phone.
- 12-column grid on desktop, 24px gap. Breakpoints: **640px**, **960px**, **1200px**.
- Top bar: sticky, **64px** high, `--bg` fill with a 1px `--line` bottom border. Left: wordmark. Centre/right: nav links (Home, Drill, Checker, Learn, Help). Right end: theme toggle. Under 960px the nav moves to a **bottom tab bar** (64px + `env(safe-area-inset-bottom)`, 5 icon+label items, label 12px). The active item has an `--accent` label and a 3px `--accent` bar above the icon.
- The wordmark is the text "Scam Drill" in Display 800, 22px. A 6px-high `--marker` stroke sits behind the lower half of the word "Drill" (a rectangle, slightly rotated -1.5deg, drawn with a pseudo-element).
- Only one `<h1>` per view. All views are sections inside one page, switched by the URL hash (`#home`, `#drill`, `#checker`, `#learn`, `#help`).

## 5. Components (exact specs)

**Buttons.** Height 48px, padding 0 24px, radius 14px, Body 16px/600.
- Primary: `--accent` fill, `--accent-ink` text. Hover: translateY(-1px) and brightness 1.08. Active: translateY(0), brightness 0.95.
- Secondary: transparent, 1.5px `--ink` border, `--ink` text. Hover: fill `--surface-2`.
- Ghost (small chips, sample buttons): height 36px, padding 0 14px, `--surface-2` fill, radius pill, 14px/500.
- Focus: 3px `--accent` outline with 2px offset on every focusable element. Never remove it.
- Disabled: 45% opacity, no hover movement.

**Surfaces.** A "card" is `--surface` with a 1px `--line` border and 24px radius, padding 24px (16px on phone). Only the phone and the feedback card use `--shadow-2`. Everything else is flat.

**Chips and badges.** Label type (12px/600 uppercase), height 28px, padding 0 12px, pill. Variants: neutral (`--surface-2`), scam (`--danger-soft` with `--danger` text), suspicious (`--warn-soft`/`--warn`), safe (`--safe-soft`/`--safe`). Each has a 14px SVG icon on the left. Colour is never the only signal: the text always says what it is.

**Red-flag marker (signature component).**

```css
.flag {
  background-image: linear-gradient(var(--marker), var(--marker));
  background-repeat: no-repeat;
  background-position: 0 72%;
  background-size: 0% 86%;
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
  transition: background-size var(--t-slow) var(--ease) var(--d, 0ms), color 0ms linear calc(var(--d, 0ms) + 120ms);
}
.flag.on { background-size: 100% 86%; color: var(--marker-ink); }
.flag.safe { background-image: linear-gradient(var(--safe-soft), var(--safe-soft)); }
.flag.safe.on { color: var(--safe); }
```

(The `linear-gradient` here is only a flat fill that can be animated through `background-size`. It must never look like a visible gradient.) The `--d` delay is set in JavaScript at 140ms * the phrase index, so flags sweep in one after another, left to right in the order they appear. In the checker, high-severity matches use `--danger-soft` with `--danger` text, medium use `--warn-soft` with `--warn`, low use `--surface-2`.

**Phone frame (Drill and Home hero).**
- Width 360px, min-height 640px, bezel 10px `--phone-bezel`, outer radius 44px, inner radius 34px, `--shadow-2`. Screen fill `--phone-screen`.
- Status bar: 28px, time on the left (Mono 12px), a small notch pill (96 x 22px, `--phone-bezel`) centred, battery icon on the right.
- App bar under it: 56px. Left: 36px circle avatar with the sender's initials (`--surface-2`, Display 700 14px). Next to it: sender name (Body 16px/600, one line, ellipsis) and a channel line (12px, `--ink-2`). Right: channel chip.
- Channel treatments: `sms` shows "Messages" and the sender id; `whatsapp` and `telegram` show the channel name as a neutral chip (do not copy any app's logo or colours); `call` replaces the chat area with a caller card (96px avatar with a soft pulsing ring, "Incoming call", a running timer in Mono) and the lines appear below as "Live captions"; `video` is the same with a 12px red recording dot and the label "Video call".
- Message bubbles: `--bubble` fill, 18px radius with a 4px bottom-left corner, padding 12px 14px, max-width 88%, Message type (Mono 15/24), 8px between bubbles, a 11px Mono timestamp in `--ink-2` under each. Phrases listed in the scenario `flags` are wrapped in `<span class="flag">` after the player answers.
- The chat area scrolls inside the phone if needed. The phone is never taller than `100dvh - 120px`.

**Choice buttons (Drill).** Full width, min-height 56px, padding 12px 16px, radius 14px, 1.5px `--line` border, `--surface` fill, left-aligned Body 16px/500 text. On the left a 28px square key chip (A, B, C, D in Mono 14px/500, `--surface-2`, radius 8px). Hover: border becomes `--accent`, translateY(-1px). Keyboard: pressing A to D (or 1 to 4) chooses.

**Progress bar.** 10 segments, each 6px high with a 4px gap, radius 3px. Empty `--line`. Current `--accent`. After answering the segment fills `--safe` (best), `--warn` (partial) or `--danger` (bad), with a 250ms scale-in from the left.

**Feedback card.** Appears under the choices after an answer. `--surface` fill, 24px radius, `--shadow-2`, padding 24px. Content order: result chip ("Best answer", "Partly right", "Risky choice"), a floating points chip "+10" on the right, one sentence of feedback for the chosen option (Body), then a list "What gave it away" with one row per red flag (the flagged phrase in Mono 14px with the marker style, and the reason in Body small underneath), then "Golden rule" in a `--accent-soft` box (Label eyebrow + Body 16/600), then the "Next" primary button (or "See results" on the last round).

**Meter (Checker).** A horizontal bar, 14px high, radius pill, three zones fixed at 0 to 29 (`--safe-soft`), 30 to 59 (`--warn-soft`), 60 to 100 (`--danger-soft`). A 4px wide, 28px tall `--ink` marker with a rounded top sits at the score position and slides in 700ms with `--ease`. Zone labels (Label type) sit below at the zone starts.

**Accordion (Learn).** Row height 64px, 1px `--line` bottom border, title in H3, a 20px plus icon that rotates 45deg when open (250ms). The panel opens by animating `grid-template-rows` from 0fr to 1fr over 300ms.

## 6. Screens

### 6.1 Home (`#home`)
Two columns on desktop (7 / 5), stacked on phone with the phone mock below the text.
- Left: eyebrow "Digital payment fraud practice" (Label, `--accent`). H1 in Display XL: **"Can you tell a real message from a trap?"**. Body (max 52ch, `--ink-2`): "Practise real-world UPI, OTP and KYC scams in a safe phone simulator, then check any suspicious message in seconds. Nothing you type leaves your device." Buttons: Primary "Start the drill", Secondary "Check a message". Under the buttons, a single line in Body small: "Takes about 5 minutes. No sign-up."
- Right: the phone mock showing the first scenario's message. 600ms after load the marker sweeps over its flag phrases (stagger 140ms). After 6 seconds, the loop is not repeated.
- Below (96px gap): "How it works" with three columns. Each has an H3, two lines of Body, and a 40px outline SVG icon: Play the drill, Check any message, Know what to do if it happens. (This is a real three-step flow, so a numeral prefix is allowed here, in Mono 14px `--ink-2`.)
- Below: a full-width `--ink` band (in dark mode `--surface-2`) with a left-aligned quote-style line in Display 700, `clamp(24px,3.2vw,36px)`: "A PIN means money goes out. You never need one to receive." and a Body small caption "The one UPI rule worth remembering."
- Footer: 1px top border, Body small, "Educational project. Not legal or financial advice. Verify rules on rbi.org.in."

### 6.2 Drill (`#drill`)
- Intro state: H1 "The drill", Body "10 situations. Pick what you would really do. Points: 10 for the best answer, partial credit for safe-but-incomplete ones, 0 for risky ones." Button "Begin". Show the best score from `localStorage` if present as a Label chip "Your best: 80 / 100".
- Play state, desktop: two columns (5 / 7). Left: phone. Right: round header (Label "Round 3 of 10" and a category chip), the progress bar, the scenario title (H2), the `context` line (Body, `--ink-2`), the question (H3), then the four choice buttons stacked with 12px gaps.
- Play state, phone: the phone first (full width up to 360px, centred), then everything else below it.
- When a message set has several messages, bubbles appear one by one: a typing indicator (three 6px dots, 1.2s loop, 600ms) then the bubble fades and rises 8px over 250ms, with 450ms between messages. The choices fade in only after the last message (250ms).
- On answer: choices lock. The chosen button takes the verdict colours (`--safe-soft`/`--warn-soft`/`--danger-soft` fill with a matching 1.5px border and a verdict icon on the right). The best answer, if not chosen, gets a `--safe` outline. Others fade to 45%. Then 300ms later the marker sweeps over the flags in the phone and the feedback card slides in (translateY 16px to 0, opacity, 320ms). A "+10" chip floats up 24px and fades over 900ms. The running score at the top right counts up (400ms).

### 6.3 Results (inside `#drill`, after round 10)
- Left column: eyebrow "Your result", rank in H1 ("Scam-proof", "Alert" or "At risk") with its chip, the score as Number XL (counts from 0 over 900ms) followed by "/ 100" in Display 700 28px `--ink-2`, one sentence about the rank.
- Right column: a list of the 10 rounds. Each row has the scenario title, a verdict icon and the points. Clicking a row opens a small panel with that scenario's lesson and golden rule.
- Below: badges earned (see spec) as 88px square tiles (`--surface-2`, 24px radius, a 32px SVG, Label caption). Locked badges are 40% opacity with a lock icon.
- Buttons: Primary "Play again" (new random 10), Secondary "Copy my score" (copies "I scored 80/100 on Scam Drill. Can you beat me?"), Ghost "Check a message".

### 6.4 Checker (`#checker`)
- H1 "Check a message". Body: "Paste an SMS or WhatsApp message. Scam Drill looks for the tricks scammers use. It runs on your device and sends nothing anywhere."
- Two columns on desktop (6 / 6): left is the input, right is the result. On phone they stack.
- Input: a textarea, min-height 220px, `--surface` fill, 1.5px `--line` border, 14px radius, padding 16px, Message type (Mono 15/24). A character count (Body small) bottom right. Under it: Primary "Check message", Ghost "Clear", and a row of 4 ghost chips "Try a sample: KYC SMS / Fake refund / Lucky draw / Genuine OTP".
- Result (initially an empty state that says "Your result will appear here" with a faint outline icon): the meter, the verdict in H1 in the level colour with its chip, the summary line, then "The message, marked up" (the original text in a `--surface-2` box with Mono 15/24, spans wrapped by severity), then "Warning signs found" as a list of rows: severity chip, label (Body 16/600) and the reason (Body small, `--ink-2`). The score counts up in 700ms while the meter marker slides.
- Always show, under the result, a Body small note: "This is a pattern check, not a guarantee. If a message asks for money, a code or a link click, confirm through the official app."

### 6.5 Learn (`#learn`)
- H1 "What scammers do". Three accordion groups with H2 titles: **Common scams** (from the spec: 8 items), **Golden rules** (6 short rules, each in Display 700 `clamp(20px,2.4vw,26px)` as a stacked list with a 1px divider), **If your money is at risk: your rights** (RBI liability summary and links).
- Each scam row (when open) shows: how it works (Body), the giveaway (Body with one phrase marked up in `--marker`), and what to do instead (Body small, `--safe`).

### 6.6 Help (`#help`)
- H1 "It happened. Do this now." The most urgent screen in the app, so it is the calmest: no animation except the checkboxes.
- A sticky card at the top: Display 800 `clamp(48px,8vw,80px)` text "1930" (Mono tabular), Label "National Cyber Crime Helpline", Body "Call within the first hour. Fast reports can freeze the money before it moves on." and a primary "Call 1930" button (a `tel:1930` link). Under it, a Body small link to cybercrime.gov.in.
- A checklist of 6 steps as large rows (min-height 64px) each with a 28px rounded checkbox (3px `--ink` border when empty, `--safe` fill with a check on done). Progress is saved to `localStorage`. A line "3 of 6 done" updates.
- Below: "What to have ready" (a short list) and "Report fake messages" with links.

## 7. Motion

| Moment | Property | Duration | Easing |
|---|---|---|---|
| View change | opacity 0 to 1, translateY 8px to 0 | 250ms | `--ease` |
| Button hover | transform, filter, border-color | 150ms | ease-out |
| Typing dots | opacity pulse, staggered 150ms | 1.2s loop | ease-in-out |
| Bubble in | opacity, translateY 8px to 0 | 250ms | `--ease` |
| Marker sweep | background-size 0% to 100% | 500ms, 140ms stagger | `--ease` |
| Feedback card in | opacity, translateY 16px to 0 | 320ms | `--ease` |
| Progress segment fill | scaleX 0 to 1, origin left | 250ms | `--ease` |
| Points chip | translateY 0 to -24px, opacity 1 to 0 | 900ms | ease-out |
| Score count-up | number | 400ms (round), 900ms (result) | ease-out |
| Meter marker | left position | 700ms | `--ease` |
| Accordion | grid-template-rows 0fr to 1fr | 300ms | `--ease` |

Add one rule only: `@media (prefers-reduced-motion: reduce)` sets every transition and animation to 0.01ms and shows markers in their final state immediately.

## 8. Accessibility and quality bar

- Text contrast at least 4.5:1 in both themes. Check `--ink-2` on `--surface-2`.
- Everything works with the keyboard: Tab order follows the visual order, A to D choose answers, Enter activates, Escape closes panels.
- The feedback card has `aria-live="polite"`. The phone chat is `role="log"`. The meter has `role="meter"` with `aria-valuenow`.
- Touch targets at least 44px.
- Verdicts are never colour-only: always an icon and a word.
- No horizontal scroll at 360px width. Test at 360, 768, 1280 and 1920.
- No layout shift: reserve the phone's height before messages appear.
- Page loads fast: no images, SVG icons inline, fonts with `display=swap` and a real fallback stack.

## 9. Copy style

Short, direct sentences. Active voice. Say what a button does ("Check message", not "Submit"). Errors say what went wrong and how to fix it ("Paste a message first, then press Check message"). Use "Rs" with a space before the amount, as in the data files. No jokes at the player's expense.

## 10. Deliverable

Create `index.html`, `css/styles.css`, `js/app.js`, `js/game.js`, `js/checker-ui.js` and `js/help-learn.js` exactly as listed in `PROJECT_SPEC.md`. The files in `data/` already exist; load them with plain `<script>` tags and do not modify them. When finished, open the app at 360px, 768px and 1280px widths in both themes and fix any overflow, clipped text or unreadable colour before reporting back.
