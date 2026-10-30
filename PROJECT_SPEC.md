# PROJECT SPEC: Scam Drill

Everything an AI coding tool needs to build this project. Read this file fully before writing any code. Read `DESIGN_PROMPT.md` for every visual decision (colours, fonts, sizes, motion). Where the two disagree on visuals, `DESIGN_PROMPT.md` wins. Where they disagree on behaviour, this file wins.

## 0. How to use these files

Folder you will have:

```
scam-drill/
  PROJECT_SPEC.md        (this file)
  DESIGN_PROMPT.md       (all visual rules)
  data/
    scenarios.js         (DONE: 12 drill scenarios, window.SCENARIOS)
    checker-rules.js     (DONE: message checker engine, window.ScamChecker)
    learn-data.js        (DONE: Learn and Help content, window.LEARN)
  index.html             (TO BUILD)
  css/styles.css         (TO BUILD)
  js/app.js              (TO BUILD: router, theme, shared helpers)
  js/game.js             (TO BUILD: drill engine and results)
  js/checker-ui.js       (TO BUILD: checker screen)
  js/help-learn.js       (TO BUILD: Learn and Help screens)
```

The three `data/` files are finished and tested. **Do not rewrite or "improve" them.** Load them with normal `<script src>` tags before the app scripts.

Suggested order of prompts to your coding tool, one per message, checking the result in the browser after each:
1. "Read PROJECT_SPEC.md and DESIGN_PROMPT.md. Create the file structure, `index.html` shell, the tokens and base styles, the top bar and bottom tab bar, the hash router and the theme toggle. Nothing else yet."
2. "Build the Home screen exactly as in DESIGN_PROMPT.md section 6.1, including the phone mock with the marker animation."
3. "Build the Drill: intro, play, feedback, results (spec section 6, DESIGN_PROMPT 6.2 and 6.3)."
4. "Build the Checker screen (spec section 7, DESIGN_PROMPT 6.4)."
5. "Build Learn and Help (DESIGN_PROMPT 6.5 and 6.6, content from `data/learn-data.js`)."
6. "Run the acceptance checklist in spec section 12 and fix every failure."

## 1. Project summary

| | |
|---|---|
| Name | Scam Drill |
| Type | Single-page web app, runs fully in the browser, no server |
| One-line pitch | A phone simulator where people practise spotting real Indian payment scams, plus a tool that checks any suspicious message. |
| Subject | Financial Learning and Banking, Unit 5: Digital Payment Fraud Awareness Simulator |
| Audience | Students, parents, first-time UPI users, anyone with a smartphone in India |
| Single job | Make the user safer the next time a scammer contacts them |
| Language | English (all content is in the data files) |

### 1.1 Problem
Digital payment fraud in India is rising, and most victims are not careless. They are rushed, frightened or tricked into pressing the wrong button. Reading a list of tips does not build the reflex to say no under pressure. Practising does.

### 1.2 What the project teaches (link this to the syllabus in the presentation)
- How UPI works: a PIN or a scan always means money goes out, receiving needs nothing.
- OTPs, PINs, CVV and what each protects.
- KYC: what it really is and where it is done.
- How banks and RBI-regulated lenders behave, versus fake lenders.
- Basic investor protection (SEBI-registered advisers, no guaranteed returns).
- Customer rights when a fraud happens (RBI limited-liability framework) and where to complain (Ombudsman).
- Digital payment ecosystem risks (fintech, UPI, wallets, loan apps).

### 1.3 Core features (MVP, all must work)
1. **Drill game**: 10 random scenarios out of 12, shown in a fake phone. The player chooses an action, gets scored, and sees the red flags marked in yellow.
2. **Message Checker**: paste a message, get a 0 to 100 risk score, a verdict, the message with warning phrases marked, and plain reasons.
3. **Results**: score out of 100, rank, per-round review, badges, best score saved.
4. **Learn**: 8 scam types, 6 golden rules, customer-rights summary.
5. **Help**: "It happened, do this now" checklist with the 1930 helpline.
6. **Dark and light themes**, fully responsive down to 360px.

### 1.4 Nice-to-have (only after everything above passes)
- Share card: a canvas image of the score the user can copy.
- A "scam of the day" line on Home chosen from `LEARN.scams` by date.
- Sound effects (off by default).
- Hindi or Marathi translation by moving all strings into a `strings` object keyed by language.

### 1.5 Explicitly out of scope
No accounts, no backend, no database, no analytics, no real AI API calls, no payments, no real bank names or logos. The word "AI" appears in the presentation as: pattern-detection rules plus scenario-based adaptive feedback (see section 11).

## 2. Tech stack and constraints

| Layer | Choice | Why |
|---|---|---|
| Markup | HTML5, semantic elements (`header`, `nav`, `main`, `section`, `footer`, `button`) | Accessibility, zero tooling |
| Style | One CSS file, custom properties for all tokens | Easy light/dark theming |
| Logic | Vanilla JavaScript (ES2018), **classic `<script>` tags, not ES modules** | Modules are blocked when opening `index.html` from `file://` in Chrome |
| Data | JS files assigning `window.SCENARIOS`, `window.ScamChecker`, `window.LEARN` | Loads from `file://` with no `fetch` |
| Fonts | Google Fonts (Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono) with fallback stacks | See DESIGN_PROMPT section 3 |
| Icons | Inline SVG, 2px stroke, round caps, `currentColor` | No icon library |
| Storage | `localStorage`, always inside try/catch | Best score, theme, help checklist |
| Hosting | Opens by double-click. For a live link: drag the folder to Netlify Drop, or push to GitHub Pages | Free |

Rules for the code:
- No frameworks, no build step, no npm, no CDN libraries.
- No inline event handlers. Use `addEventListener`.
- One global namespace object `App` in `app.js`; other files attach to it (`App.game`, `App.checker`, `App.helpLearn`).
- Build DOM with small helper functions (`h(tag, attrs, ...children)`) or template literals. Escape any user-pasted text before inserting into HTML (see section 7.4).
- Keep functions small and name them for what they do. Add a short comment above each major function.
- Never use `eval`, `innerHTML` with user input, or `document.write`.

## 3. Architecture and data pipeline

```
                    +--------------------+
  data/scenarios.js |  SCENARIOS (12)    |
                    +---------+----------+
                              | pick 10, shuffle
                              v
 user taps  --->  game.js  state machine  --->  render phone + choices
 a choice          (intro > play > feedback > results)
                              |
                              | points, verdicts, ids
                              v
                        results view  --->  localStorage (best score)

                    +--------------------+
 data/checker-      |  ScamChecker       |
 rules.js           |  .analyze(text)    |
                    +---------+----------+
                              ^
 user pastes text -> checker-ui.js -> analyze -> {score, level, matches[]}
                              |
                              v
             meter + verdict + marked-up text + reasons (local only)

 data/learn-data.js --> help-learn.js --> Learn accordions + Help checklist
```

Everything flows one way: data in, state in a plain object, render function out. When state changes, call the screen's `render()` again (or update only the part that changed).

### 3.1 Router
- Views: `home`, `drill`, `checker`, `learn`, `help`. Each is a `<section id="view-...">`. Only one is visible (use the `hidden` attribute).
- The URL hash selects the view. On load and on `hashchange`, show the matching view, or `home` if the hash is empty or unknown. Update the active nav item and `document.title` ("Drill | Scam Drill").
- Move focus to the view's `<h1>` after a change and scroll to the top.

### 3.2 Global state
```js
App.state = {
  theme: 'system' | 'light' | 'dark',
  game: { phase: 'intro'|'play'|'feedback'|'results', rounds: [], index: 0, score: 0, answers: [] },
  best: number | null
};
```

### 3.3 Local storage keys (all prefixed `scamdrill.`)
| Key | Value |
|---|---|
| `scamdrill.theme` | `"light"` or `"dark"` (absent = follow system) |
| `scamdrill.best` | integer 0 to 100 |
| `scamdrill.badges` | JSON array of badge ids earned so far |
| `scamdrill.help` | JSON array of completed Help step indexes |

Every read and write is wrapped in try/catch. The app must work fully when storage is blocked.

## 4. User journeys

**Journey A: first-time visitor (the demo path)**
1. Lands on Home. Sees the headline, the phone with a scam SMS, and the marker sweeping the red-flag phrases.
2. Presses "Start the drill". Hash becomes `#drill`, intro screen shows.
3. Presses "Begin". Round 1: messages appear in the phone, then four choices.
4. Chooses an answer. Choices lock, the verdict colours show, the marker highlights the flags in the phone, the feedback card slides in with points, reasons and the golden rule.
5. Presses "Next". Repeats for 10 rounds.
6. Sees Results: rank, score count-up, round review, badges.
7. Presses "Check a message", pastes a scam they received, and sees the verdict.

**Journey B: someone just got a suspicious SMS**
Home (or direct link `#checker`) > pastes the message > "Check message" > reads verdict and reasons > if worried, goes to Help.

**Journey C: someone has been scammed**
`#help` > sees 1930 first > ticks off the checklist > opens links to report.

## 5. Drill: exact behaviour

### 5.1 Starting a round set
1. Copy `SCENARIOS`, shuffle with Fisher-Yates, take the first 10. Store as `game.rounds`.
2. For each scenario, shuffle the order of its `choices` so the correct answer is not always in the same place. Keep each choice's `id`.
3. `game.index = 0`, `game.score = 0`, `game.answers = []`.

### 5.2 Showing a scenario (phase `play`)
1. Header: "Round {index+1} of 10", category chip, progress bar, running score.
2. Phone shows sender and channel (see DESIGN_PROMPT 5, "Phone frame").
3. Messages appear one by one with the typing indicator (600ms) and 450ms between bubbles.
4. After the last message: show the title, context, question, and the four choices (fade in 250ms). Choices are disabled while messages are still arriving.
5. If the user presses a choice key early, ignore it.

### 5.3 Answering (phase `feedback`)
1. Lock all choices. Mark the chosen one with its verdict (`best`, `partial`, `bad`).
2. If the chosen one is not `best`, outline the best one in `--safe`.
3. Add `points` to `score`. Push `{ id, category, title, choiceId, verdict, points }` to `answers`.
4. Fill the progress segment. Float the "+N" chip.
5. After 300ms: wrap each `flags[i].phrase` found in the message texts with `<span class="flag">` (or `class="flag safe"` when `type === 'green'`), set `--d` to `i * 140ms`, then add class `on` on the next frame so the sweep animates.
6. Slide in the feedback card with: result chip, the chosen choice's `feedback`, the "What gave it away" list from `flags`, the golden rule, and the Next button. For a genuine (all green flags) scenario, rename the list "What made it genuine".
7. "Next" goes to the next round, or to Results after round 10. Focus moves to the new round's heading.

### 5.4 Marking phrases safely
Messages are plain text from our own data, but still build them safely: split the text at each phrase's position, create text nodes and `<span>` elements. If two phrases overlap, mark the earlier one only. If a phrase is not found, skip it silently.

### 5.5 Scoring and ranks
- Per round: `best` = 10, `partial` = the choice's `points`, `bad` = 0. Maximum total is 100.
- Rank by total: **90 to 100 = "Scam-proof"** (safe chip), **60 to 89 = "Alert"** (warn chip), **0 to 59 = "At risk"** (danger chip).
- Rank sentences: Scam-proof "You spotted almost every trick. Teach someone else what you learned." Alert "You catch most scams. Review the rounds you missed." At risk "These tricks work on many people. Replay, and read the Learn section."
- Save `best` if the new score is higher.

### 5.6 Badges (evaluate on Results, store ids in localStorage)
| Id | Name | Rule |
|---|---|---|
| `perfect` | Perfect drill | Every round `best` |
| `otp` | OTP guardian | `fraud-team-call` and `genuine-otp` both `best` (only if both appeared) |
| `upi` | UPI pro | `upi-collect` and `qr-receive` both `best` (only if both appeared) |
| `calm` | Cool head | `digital-arrest` is `best` |
| `streak` | Five in a row | Five consecutive `best` answers |
| `reborn` | Second attempt | Beat your previous best by at least 10 points |

A badge that has never been earned shows locked.

## 6. Results screen
Follows DESIGN_PROMPT 6.3. Data comes from `game.answers`. Clicking a row reveals the scenario's `lesson` and `goldenRule` (look up by `id`). "Play again" restarts with a new random 10. "Copy my score" uses `navigator.clipboard.writeText` inside the click handler and catches rejection; on failure it selects a visible text field with the sentence so the user can copy it by hand.

## 7. Checker: exact behaviour

### 7.1 Flow
1. User pastes or types a message (max 2,000 characters; truncate with a visible note beyond that).
2. "Check message" is disabled until there is at least 8 non-space characters. Pressing it with less shows the error "Paste a message first, then press Check message."
3. Call `ScamChecker.analyze(text)`. It returns `score`, `level` (`high|medium|low`), `verdict`, `summary`, `matches[]`, `notes[]`, `standardOtp`.
4. Render the result (DESIGN_PROMPT 6.4).

### 7.2 How the engine works (explain this in the presentation)
- A list of about 25 **rules**. Each rule has an id, a plain label, a regular expression, a weight, and a one-sentence reason.
- Every rule that matches adds its weight once. Weights are higher for the strongest scam signals (asking for an OTP, a safe account or a remote-access app scores 35 to 40; a generic greeting scores 8).
- If three or more different rules match, +10 (several tricks together is a stronger signal). Total capped at 100.
- **Negation handling:** phrases like "do not share" are detected first, and an OTP warning inside them does not count as asking for the OTP. That is why a genuine bank OTP message scores 0.
- Levels: **60 to 100 = Very likely a scam**, **30 to 59 = Suspicious**, **0 to 29 = Low risk** (with a special "normal OTP message" note).
- Everything runs in the browser. Nothing is uploaded.

### 7.3 Sample messages (the four sample chips fill the textarea)
```
KYC SMS:
Dear Customer, your Navbharat Bank account will be BLOCKED today. Complete KYC immediately: http://navbharat-kyc.co.in/update

Fake refund:
Your QuickBite refund of Rs 349 has failed. Please install the QuickSupport app from the link and share the 9-digit code shown on your screen.

Lucky draw:
CONGRATULATIONS! You have won Rs 25,00,000 in the Mega Diwali Lucky Draw. Pay Rs 4,500 GST charges to claim your prize today.

Genuine OTP:
482913 is your OTP for Rs 1,299 payment to ShopKart. Do not share it with anyone. Valid for 10 minutes. -Navbharat Bank
```
Expected results from the current engine: KYC SMS about 93 (Very likely a scam), fake refund 40 (Suspicious), lucky draw 55 (Suspicious), genuine OTP 0 (Looks like a normal OTP).

### 7.4 Rendering the marked-up text
`matches[].spans` are `{start, end}` positions in the original string. Merge all spans from all matches, sorted by `start`; where spans overlap keep the one from the higher-weight match. Build the output with text nodes and `<span class="mark high|medium|low">`. **Never** put the user's text through `innerHTML`. Preserve line breaks with `white-space: pre-wrap`.

### 7.5 Reasons list
One row per entry in `matches` (already sorted by weight): severity chip (High, Medium or Low), `label`, `why`. Show `notes[]` as a neutral info box above the list. If `matches` is empty, show only the notes.

## 8. Learn and Help
Content comes from `window.LEARN`. Do not hard-code any scam text, rule, step or link in the JavaScript.
- **Learn**: three groups. Scam types (`LEARN.scams`) as accordions. Golden rules (`LEARN.rules`) as a large-type list. Rights (`LEARN.rights`): intro, five point rows, and the disclaimer in Body small. Show the `giveaway` phrase inside the "how it works" text with the marker style where it appears, or on its own line if it does not.
- **Help**: the 1930 card, a checkbox list from `LEARN.helpSteps` (title in Body 16/600, detail in Body small), progress text, "What to have ready" from `LEARN.ready`, and the links from `LEARN.links` (open in a new tab with `rel="noopener noreferrer"`). The `tel:1930` button is a plain link.

## 9. Content and facts to keep accurate
- Helpline **1930** and **cybercrime.gov.in** are the national cyber-crime helpline and reporting portal.
- Sanchar Saathi (sancharsaathi.gov.in) is the Department of Telecommunications portal for reporting suspicious calls and messages.
- RBI customer-liability rules: reporting within 3 working days gives zero liability when you are not at fault; 4 to 7 working days gives limited liability; shared credentials are treated as customer negligence until the report. RBI has announced a new small-value digital-fraud compensation framework in 2026, so the app deliberately **does not state exact rupee limits**. It links to rbi.org.in. Keep it that way unless you verify the current circular.
- All banks, apps, brands, names and phone numbers in the scenarios are fictional. Do not replace them with real brand names.

## 10. Non-functional requirements
- Works offline after the first load (fonts fall back to the system stack).
- Loads in under 2 seconds on a normal mobile connection (total JS under 80 KB, no images).
- Works in current Chrome, Edge, Firefox and Safari, on Android and iOS.
- Responsive from 360px to 1920px wide with no horizontal scroll.
- Accessible: keyboard navigation, visible focus, text contrast at least 4.5:1, screen-reader labels, verdicts never colour-only, `prefers-reduced-motion` respected.
- Privacy: no network requests other than fonts. Pasted messages stay in memory and are never stored.

## 11. How to present this to the teacher
Suggested talking points (3 to 5 minutes):
1. **Problem**: digital payment fraud, with the three tricks that cause most losses (OTP, collect request or QR, fake authority).
2. **Link to syllabus**: Unit 5 fintech and digital payments; touches Unit 3 (banking, KYC, loans, regulation by RBI), Unit 2 (SEBI and investor safety) and Unit 1 (documents and verification).
3. **Live demo**: play two rounds (the UPI collect request and the digital arrest), show the yellow marker, then paste a message into the checker.
4. **How the "AI" works**: rule-based pattern detection with weighted scoring, negation handling, and adaptive feedback per answer; explain why a rules engine is the right choice (explainable, private, instant, works offline). Mention the optional upgrade of replacing the rules with a language model.
5. **Impact**: the lesson is the rule "PIN means money goes out", and the habit of verifying in the official app.
6. **Limits** (say this yourself before the teacher asks): it is an educational pattern check, not a guarantee; rules need updating as scams change.

## 12. Acceptance checklist (the AI must run through this before saying "done")
Functional
- [ ] Opening `index.html` by double-click shows Home with no console errors.
- [ ] All five views reachable from the nav and by typing the hash in the URL.
- [ ] Drill plays 10 rounds, no scenario repeats in one game, and choices are shuffled.
- [ ] Marker highlights appear for every scenario's flags (check all 12). A flag whose phrase is missing does not crash the app.
- [ ] Points total is correct. The score on Results equals the sum of the rounds.
- [ ] Best score and badges persist after reload. With storage blocked the app still works.
- [ ] Checker returns the expected results for the four samples (7.3). A pasted `<script>alert(1)</script>` shows as text and does not run.
- [ ] Learn shows 8 scam types, 6 rules and the rights section. Help checklist state persists.
- [ ] "Copy my score" works or falls back to a selectable field.

Design
- [ ] Colours, fonts, sizes, radii and motion match DESIGN_PROMPT.md.
- [ ] Light and dark themes both look finished. Toggle works and is remembered.
- [ ] No horizontal scroll and no clipped text at 360px, 768px, 1280px, 1920px.
- [ ] Bottom tab bar under 960px, top nav above.
- [ ] `prefers-reduced-motion` removes movement and shows markers instantly.

Quality
- [ ] Every interactive element is reachable and operable by keyboard, with a visible focus ring.
- [ ] A to D / 1 to 4 choose answers in the Drill.
- [ ] Lighthouse accessibility score 95 or above.
- [ ] No `innerHTML` with user text anywhere (search the code).
- [ ] No emoji in the interface.

## 13. Glossary (for the report)
- **UPI**: Unified Payments Interface, instant bank-to-bank payments run by NPCI.
- **Collect request**: a UPI request for you to pay someone. Approving it sends money.
- **OTP**: one-time password that approves a single action. **PIN**: secret number that approves any UPI payment. **CVV**: three-digit code on a card.
- **KYC**: Know Your Customer, identity verification required by banks.
- **Social engineering**: tricking a person into giving access instead of hacking a system.
- **RBI**: Reserve Bank of India, the banking regulator. **SEBI**: securities regulator. **NPCI**: runs UPI and RuPay.
- **1930**: National Cyber Crime Helpline.
