/*
  Scam Drill - the drill
  Phases: intro > loading > play > feedback > results.
  Scenarios come from the local Ollama model when it is available, and from the
  bundled bank (data/scenarios.js) when it is not. Everything else is local.
*/
(function () {
  'use strict';

  var App = window.App;
  var h = App.h;
  var icon = App.icon;
  var clear = App.clear;
  var chip = App.chip;
  var s = App.state.game;

  var root = null;
  var phone = null;
  var choicesEl = null;
  var scoreEl = null;
  var currentSeg = null;
  var choicesReady = false;
  var answered = false;
  var timers = [];
  var ticker = null;
  var sessionToken = 0;
  var generation = null;

  /* ------------------------------------------------------------------ *
   * 1. Timers
   * ------------------------------------------------------------------ */

  function later(fn, ms) {
    var id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    timers.forEach(window.clearTimeout);
    timers = [];
    if (ticker !== null) { window.clearInterval(ticker); ticker = null; }
  }

  /* ------------------------------------------------------------------ *
   * 2. AI generation (local Ollama only)
   * ------------------------------------------------------------------ */

  var AI = (function () {
    var MODEL = window.SCAM_DRILL_MODEL || 'qwen2.5-coder:7b';
    var TIMEOUT_MS = Number(window.SCAM_DRILL_AI_TIMEOUT) || 360000;

    var SYSTEM_PROMPT = [
      'You write scam-awareness practice scenarios for an Indian digital-payment fraud literacy app.',
      'All content is fictional and educational. You output only JSON.',
      'Never explain how to commit fraud. Never invent helpline numbers or reporting links.'
    ].join(' ');

    /*
      Kept deliberately short: every token here is prompt cost, and the reply
      is the real cost. Fields that normalize() fills in itself (question) are
      not requested. Wording limits are word counts, not characters, because
      the model budgets tokens more accurately by words.
    */
    var USER_PROMPT = [
      'Write 10 new practice scenarios for an app that teaches people in India to spot digital-payment scams.',
      'Return only one JSON object: {"scenarios":[{...}]} containing exactly 10 objects with these keys:',
      'title, category, channel, sender, context, difficulty, messages (array of one string), choices (4 x {text, verdict, feedback}), flags (2 x {phrase, why}), explanation, lesson, goldenRule',
      '',
      'Rules:',
      '- All 10 different. Cover these in any order: UPI collect request, QR code trick, phishing SMS, fake customer-care call, digital arrest, job or task scam, investment scam, parcel scam, OTP fraud, impersonation of a family member or official.',
      '- 4 choices per scenario, exactly one best, the rest partial or bad. Real actions, never jokes.',
      '- Everyday Indian setting: UPI apps, KYC notices, parcels, bills, job offers. Every name, bank, brand, link and phone number is invented.',
      '- Be brief. title <= 32 characters. context <= 60 characters. choice text <= 60 characters. feedback <= 12 words. explanation <= 10 words. lesson <= 12 words. goldenRule <= 10 words. No filler.',
      '- One message per scenario, under 140 characters, written like a real SMS, chat or caller transcript.',
      '- flags: exactly 2. phrase is copied word for word from the message, 3 to 8 words, appears once. why <= 8 words. Default type is red.',
      '- channel is one of sms, whatsapp, call, video, telegram. difficulty is easy, medium or hard; mix them.',
      '- Invented links look like http://navbharat-kyc-update.co.in. Never use a real bank, brand, app, website, government portal or real phone number.',
      '- No number is ever presented as a helpline to call. Scam messages may contain invented numbers.',
      '- Calm factual tone, no emoji. Write money as Rs 4,500.',
      'Do not include a question field. Output the JSON object only.'
    ].join('\n');

    var BANNED = /\b(sbi|state bank|hdfc|icici|axis bank|kotak|yes bank|indusind|idfc|canara|union bank|bank of baroda|punjab national|paytm|phonepe|google pay|gpay|bhim|npci|amazon|flipkart|swiggy|zomato|myntra|airtel|jio|bsnl|irctc|epfo|uidai|cred|mobikwik|freecharge|meesho|zepto|sancharsaathi|cybercrime\.gov|rbi\.org|sebi\.gov)\b/i;
    var GOV_LINK = /https?:\/\/[^\s]*\.(gov\.in|nic\.in|org\.in)\b/i;
    var TOLLFREE = /\b(1800|1860|1900)[\s-]?\d{3,}/;

    var CHANNELS = ['sms', 'whatsapp', 'call', 'video', 'telegram'];
    var DIFFICULTIES = ['easy', 'medium', 'hard'];
    var TIMES = ['9:42 AM', '10:18 AM', '11:05 AM', '12:36 PM', '2:15 PM', '4:10 PM', '6:30 PM', '8:20 PM'];

    /* Last error text, used only for the small notice under the drill. */
    var lastProblem = '';

    function text(value, max) {
      if (typeof value !== 'string') { return ''; }
      var clean = value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (clean.length > max) {
        clean = clean.slice(0, max);
        var cut = clean.lastIndexOf(' ');
        if (cut > max * 0.6) { clean = clean.slice(0, cut); }
      }
      return clean;
    }

    function slug(value) {
      return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'situation';
    }

    function clampPoints(value) {
      var n = Number(value);
      if (!isFinite(n)) { return 4; }
      return Math.min(6, Math.max(3, Math.round(n)));
    }

    /* Refuse anything that names a real bank, brand, portal or invented helpline. */
    function looksSafe(scenarioText) {
      if (BANNED.test(scenarioText)) { return false; }
      if (GOV_LINK.test(scenarioText)) { return false; }
      if (TOLLFREE.test(scenarioText)) { return false; }
      return true;
    }

    /* Turn one untrusted model object into a scenario we can render, or null. */
    function normalize(raw, usedIds) {
      if (!raw || typeof raw !== 'object') { return null; }

      var title = text(raw.title, 72);
      var context = text(raw.context, 190);
      var lesson = text(raw.lesson, 240);
      var goldenRule = text(raw.goldenRule, 170);
      if (!title || !context || !lesson || !goldenRule) { return null; }

      var explanation = text(raw.explanation, 240) || lesson;

      var messages = [];
      var rawMessages = Array.isArray(raw.messages) ? raw.messages.slice(0, 3) : [];
      rawMessages.forEach(function (entry, i) {
        var body = typeof entry === 'string' ? entry : (entry && entry.text);
        var time = entry && typeof entry === 'object' && typeof entry.time === 'string' ? text(entry.time, 12) : '';
        body = text(body, 320);
        if (!body) { return; }
        messages.push({ from: 'them', text: body, time: time || TIMES[i % TIMES.length] });
      });
      if (!messages.length) { return null; }

      var rawChoices = Array.isArray(raw.choices) ? raw.choices.slice(0, 4) : [];
      if (rawChoices.length !== 4) { return null; }

      var choiceIds = ['a', 'b', 'c', 'd'];
      var seenChoiceText = {};
      var validChoices = true;
      var bestCount = 0;
      var choices = rawChoices.map(function (entry, i) {
        if (!entry || typeof entry !== 'object') { validChoices = false; return null; }
        var body = text(entry.text, 150);
        var feedback = text(entry.feedback, 260);
        var verdict = entry.verdict === 'best' || entry.verdict === 'partial' || entry.verdict === 'bad' ? entry.verdict : null;
        if (!body || !feedback || !verdict) { validChoices = false; return null; }
        var key = body.toLowerCase();
        if (seenChoiceText[key]) { validChoices = false; return null; }
        seenChoiceText[key] = true;
        if (verdict === 'best') { bestCount += 1; }
        return {
          id: choiceIds[i],
          text: body,
          verdict: verdict,
          points: verdict === 'best' ? 10 : verdict === 'bad' ? 0 : clampPoints(entry.points),
          feedback: feedback
        };
      });
      if (!validChoices || bestCount !== 1) { return null; }

      var flags = [];
      var rawFlags = Array.isArray(raw.flags) ? raw.flags.slice(0, 4) : [];
      rawFlags.forEach(function (entry) {
        if (!entry || typeof entry !== 'object') { return; }
        var phrase = text(entry.phrase, 160);
        var why = text(entry.why, 180);
        if (!phrase || phrase.length < 8 || !why) { return; }

        /* Find the phrase in a message, ignoring case, and keep the real wording. */
        var found = null;
        for (var m = 0; m < messages.length; m++) {
          var at = messages[m].text.toLowerCase().indexOf(phrase.toLowerCase());
          if (at > -1) {
            found = { start: at, end: at + phrase.length, text: messages[m].text.slice(at, at + phrase.length), message: m };
            break;
          }
        }
        if (!found) { return; }

        var overlaps = flags.some(function (existing) {
          return existing.message === found.message && found.start < existing.end && existing.start < found.end;
        });
        if (overlaps) { return; }

        flags.push({ phrase: found.text, why: why, type: entry.type === 'green' ? 'green' : 'red', start: found.start, end: found.end, message: found.message });
      });
      if (!flags.length) { return null; }
      flags = flags.map(function (flag) {
        return { phrase: flag.phrase, why: flag.why, type: flag.type };
      });

      var category = text(raw.category, 40) || 'Scam attempt';
      var channel = CHANNELS.indexOf(raw.channel) > -1 ? raw.channel : 'sms';
      var difficulty = DIFFICULTIES.indexOf(raw.difficulty) > -1 ? raw.difficulty : 'medium';
      var sender = text(raw.sender, 44) || 'Unknown sender';
      var question = text(raw.question, 120) || 'What do you do?';

      var scenario = {
        id: slug(title),
        category: category,
        channel: channel,
        sender: sender,
        title: title,
        context: context,
        question: question,
        messages: messages,
        choices: choices,
        flags: flags,
        explanation: explanation,
        lesson: lesson,
        goldenRule: goldenRule,
        difficulty: difficulty,
        generated: true
      };

      var allText = [title, context, question, sender, category, explanation, lesson, goldenRule]
        .concat(messages.map(function (m) { return m.text; }))
        .concat(choices.map(function (c) { return c.text + ' ' + c.feedback; }))
        .concat(flags.map(function (f) { return f.phrase + ' ' + f.why; }))
        .join('\n');
      if (!looksSafe(allText)) { return null; }

      var baseId = scenario.id;
      var unique = baseId;
      var attempt = 2;
      while (usedIds[unique]) { unique = baseId + '-' + attempt; attempt += 1; }
      usedIds[unique] = true;
      scenario.id = unique;

      return scenario;
    }

    /* Validate a whole model reply. Never trust its shape or its claims. */
    function validateBatch(raw) {
      var list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.scenarios) ? raw.scenarios : []);
      var out = [];
      var usedIds = {};
      var usedTitles = {};
      list.forEach(function (item) {
        var scenario = normalize(item, usedIds);
        if (!scenario) { return; }
        var titleKey = scenario.title.toLowerCase();
        if (usedTitles[titleKey]) { return; }
        usedTitles[titleKey] = true;
        out.push(scenario);
      });
      return out;
    }

    /* Pull JSON out of a reply that may be wrapped in prose or fences. */
    function parseReply(content) {
      if (typeof content !== 'string' || !content.trim()) { throw new Error('empty'); }
      var body = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      try { return JSON.parse(body); } catch (err) { /* keep looking */ }

      var open = body.indexOf('{');
      var close = body.lastIndexOf('}');
      if (open > -1 && close > open) {
        try { return JSON.parse(body.slice(open, close + 1)); } catch (err) { /* keep looking */ }
      }
      var arrOpen = body.indexOf('[');
      var arrClose = body.lastIndexOf(']');
      if (arrOpen > -1 && arrClose > arrOpen) {
        try { return JSON.parse(body.slice(arrOpen, arrClose + 1)); } catch (err) { /* give up */ }
      }
      throw new Error('not-json');
    }

    /*
      Where to look for Ollama: the same-origin proxy first, then the direct
      port once. localhost and 127.0.0.1 are the same server, so trying both
      would just queue a second long generation.
    */
    function endpoints() {
      var urls = [];
      try {
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
          urls.push('/api/ollama/chat');
        }
      } catch (err) { /* file:// keeps the direct list */ }
      urls.push('http://localhost:11434/api/chat');
      return urls;
    }

    function requestBody() {
      return JSON.stringify({
        model: MODEL,
        stream: true,
        format: 'json',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT }
        ],
        /*
          Twelve brief scenarios overrun the cap; this leaves about 10 % headroom
          over what the model produces for ten so the tenth can finish but tiny
          extra output cannot collapse the whole reply.
        */
        options: { temperature: 0.8, top_p: 0.9, num_predict: 1850, num_ctx: 8192 },
        keep_alive: '10m'
      });
    }

    function cancel() {
      if (generation && generation.controller) {
        try { generation.controller.abort(); } catch (err) { /* ignore */ }
      }
    }

    /*
      Pull the complete scenario objects out of a reply that was cut off before
      the closing brackets arrived. Returns raw objects for the validator.
    */
    function salvageScenarios(text) {
      if (typeof text !== 'string' || !text) { return []; }
      try {
        var whole = JSON.parse(text);
        var list = Array.isArray(whole) ? whole : (whole && Array.isArray(whole.scenarios) ? whole.scenarios : []);
        if (list.length) { return list; }
      } catch (err) { /* the reply is truncated; keep scanning */ }

      var keyAt = text.indexOf('"scenarios"');
      var start = keyAt > -1 ? text.indexOf('[', keyAt) : text.indexOf('[');
      if (start < 0) { return []; }

      var objects = [];
      var depth = 0;
      var inString = false;
      var escaped = false;
      var objectStart = -1;

      for (var i = start + 1; i < text.length; i++) {
        var ch = text.charAt(i);
        if (inString) {
          if (escaped) { escaped = false; }
          else if (ch === '\\') { escaped = true; }
          else if (ch === '"') { inString = false; }
          continue;
        }
        if (ch === '"') { inString = true; continue; }
        if (ch === '{') {
          if (depth === 0) { objectStart = i; }
          depth += 1;
          continue;
        }
        if (ch === '}') {
          depth -= 1;
          if (depth === 0 && objectStart > -1) {
            try { objects.push(JSON.parse(text.slice(objectStart, i + 1))); } catch (err) { /* skip this one */ }
            objectStart = -1;
          }
          if (depth < 0) { break; }
          continue;
        }
        if (ch === ']' && depth === 0) { break; }
      }
      return objects;
    }

    /*
      Generate ten fresh scenarios. Always resolves: a failure, a timeout or a
      reply that never finished all fall back to the bundled set.
    */
    function generate(onStatus) {
      var report = typeof onStatus === 'function' ? onStatus : function () { };
      var controller = new AbortController();
      var deadline = Date.now() + TIMEOUT_MS;
      var cancelled = false;
      var partial = '';
      var sawReply = false;
      lastProblem = '';

      function cancelledResult() {
        return bundledSet('Local generation was cancelled. This drill uses the built-in set.');
      }

      /* Take whatever complete scenarios arrived, if there are enough to use. */
      function rescue() {
        var valid = validateBatch(salvageScenarios(partial));
        return valid.length >= 3 ? buildMixedSet(valid) : null;
      }            var promise = (async function () {
            var urls = endpoints();
        for (var i = 0; i < urls.length; i++) {
          report(i === 0 ? 'Contacting the local model' : 'Trying the local model again');
          try {
            var reply = await callOllama(urls[i], controller.signal, deadline, function (count) {
              if (count > 0) { report('Writing situations, ' + Math.min(count, 10) + ' of 10'); }
            }, function (text) {
              partial = text;
            });

          if (cancelled) { return cancelledResult(); }
          report('Checking the reply');
            sawReply = true;
            var valid = validateBatch(reply);
            if (valid.length) { return buildMixedSet(valid); }
            var rescued = rescue();
            if (rescued) { return rescued; }
            lastProblem = 'invalid';
          } catch (err) {
            lastProblem = err && err.name === 'AbortError' ? 'timeout' : 'offline';
            var rescuedOnError = rescue();
            if (rescuedOnError) { return rescuedOnError; }
            /*
              Try the next endpoint only when this one never began answering.
              callOllama marks a failure retryable only when no data arrived,
              so we do not re-ask an endpoint whose generation already started.
            */            if (!err || err.retryable !== true) { break; }
            if (Date.now() >= deadline - 2000) { break; }
          }
          partial = '';
        }
        if (sawReply && lastProblem === 'offline') { lastProblem = 'invalid'; }
        return bundledSet(problemNotice(lastProblem));
      })();

      generation = {
        controller: controller,
        promise: promise,
        stop: function () {
          cancelled = true;
          try { controller.abort(); } catch (err) { /* ignore */ }
        }
      };
      return generation;
    }

    function abortError() {
      var err = new Error('timeout');
      err.name = 'AbortError';
      return err;
    }

    /*
      One streaming call to Ollama. Content arrives as JSON lines; progress is
      reported by counting finished titles, and every chunk is handed back so a
      timeout can still use the scenarios that did arrive.
    */
    function callOllama(url, signal, deadline, onProgress, onPartial) {
      return new Promise(function (resolve, reject) {
        var remaining = deadline - Date.now();
        if (remaining <= 0) { reject(abortError()); return; }

        var controller = new AbortController();
        var settled = false;
        var content = '';
        var buffer = '';
        var timer = null;
        var gotData = false;

        function cleanup() {
          window.clearTimeout(timer);
          if (signal) { signal.removeEventListener('abort', onOuterAbort); }
        }
        function succeed(value) {
          if (settled) { return; }
          settled = true;
          cleanup();
          resolve(value);
        }
        function fail(err) {
          if (settled) { return; }
          settled = true;
          cleanup();
          /* Retrying is only safe when the server never began answering. */
          if (err && !gotData) { err.retryable = true; }
          reject(err);
        }
        var onOuterAbort = function () { try { controller.abort(); } catch (err) { /* ignore */ } };

        timer = window.setTimeout(function () { try { controller.abort(); } catch (err) { /* ignore */ } }, remaining);
        if (signal) { signal.addEventListener('abort', onOuterAbort); }

        function takeLine(line) {
          var trimmed = line.trim();
          if (!trimmed) { return; }
          var data;
          try { data = JSON.parse(trimmed); } catch (err) { return; }
          if (data && data.message && typeof data.message.content === 'string') { content += data.message.content; }
          else if (data && typeof data.response === 'string') { content += data.response; }
        }

        function report() {
          if (!content) { return; }
          onPartial(content);
          var count = (content.match(/"title"\s*:/g) || []).length;
          onProgress(count);
        }

        fetch(url, {
          method: 'POST',
          mode: 'cors',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody(),
          signal: controller.signal
        }).then(function (response) {
          if (!response.ok) { throw new Error('http-' + response.status); }
          /* Headers arrived, so this endpoint is reachable: never re-ask it. */
          gotData = true;

          /* Older browsers without a stream reader get the whole body instead. */
          if (!response.body || typeof response.body.getReader !== 'function') {
            return response.text().then(function (text) {
              text.split('\n').forEach(takeLine);
              if (!content) {
                try {
                  var whole = JSON.parse(text);
                  if (whole && whole.message && typeof whole.message.content === 'string') { content = whole.message.content; }
                } catch (err) { /* leave content empty */ }
              }
              if (!content) { throw new Error('empty-reply'); }
              report();
              return content;
            });
          }

          var reader = response.body.getReader();
          var decoder = new TextDecoder();

          function pump() {
            return reader.read().then(function (result) {
              if (result.done) {
                if (buffer) { takeLine(buffer); buffer = ''; }
                if (!content) { throw new Error('empty-reply'); }
                return content;
              }
              var chunk = decoder.decode(result.value, { stream: true });
              buffer += chunk;
              var index;
              while ((index = buffer.indexOf('\n')) >= 0) {
                takeLine(buffer.slice(0, index));
                buffer = buffer.slice(index + 1);
              }
              report();
              return pump();
            });
          }
          return pump();
        }).then(function (finalContent) {
          succeed(parseReply(finalContent));
        }).catch(function (err) {
          fail(err);
        });
      });
    }

    function problemNotice(problem) {
      if (problem === 'timeout') {
        return 'The local model took too long, so this drill uses the built-in set. Start Ollama and try again for new situations.';
      }
      if (problem === 'invalid') {
        return 'The local model replied with something unusable, so this drill uses the built-in set.';
      }
      return 'The local model is not reachable, so this drill uses the built-in set. Start Ollama and try again for new situations.';
    }

    /* Deep copy so the bundled data is never mutated by shuffling. */
    function copyScenario(scenario) {
      return {
        id: scenario.id,
        category: scenario.category,
        channel: scenario.channel,
        sender: scenario.sender,
        title: scenario.title,
        context: scenario.context,
        question: scenario.question,
        messages: (scenario.messages || []).map(function (m) {
          return { from: 'them', text: m.text, time: m.time };
        }),
        choices: (scenario.choices || []).map(function (c) {
          return { id: c.id, text: c.text, verdict: c.verdict, points: c.points, feedback: c.feedback };
        }),
        flags: (scenario.flags || []).map(function (f) {
          return { phrase: f.phrase, why: f.why, type: f.type };
        }),
        explanation: scenario.explanation || '',
        lesson: scenario.lesson,
        goldenRule: scenario.goldenRule,
        difficulty: scenario.difficulty || 'medium',
        generated: !!scenario.generated
      };
    }

    function prepare(list) {
      return App.shuffle(list).slice(0, 10).map(function (scenario) {
        var copy = copyScenario(scenario);
        copy.choices = App.shuffle(copy.choices);
        return copy;
      });
    }

    function bundledSet(notice) {
      var bank = window.SCENARIOS || [];
      return {
        rounds: prepare(bank.slice(0, 10)),
        source: 'bundled',
        notice: notice || 'Built-in situations.'
      };
    }

    /* Top up an incomplete model reply with bundled scenarios, never repeats. */
    function buildMixedSet(valid) {
      var rounds = valid.slice(0, 10);
      var usedTitles = {};
      rounds.forEach(function (scenario) { usedTitles[scenario.title.toLowerCase()] = true; });

      if (rounds.length < 10) {
        var bank = App.shuffle(window.SCENARIOS || []);
        for (var i = 0; i < bank.length && rounds.length < 10; i++) {
          var key = bank[i].title.toLowerCase();
          if (!usedTitles[key]) {
            usedTitles[key] = true;
            rounds.push(copyScenario(bank[i]));
          }
        }
      }

      var mixed = valid.length < 10;
      return {
        rounds: prepare(rounds),
        source: mixed ? 'mixed' : 'ai',
        notice: mixed
          ? 'The local model produced ' + valid.length + ' usable situations. The rest of this set is built in.'
          : ''
      };
    }

    return {
      generate: generate,
      cancel: cancel,
      validateBatch: validateBatch,
      prepare: prepare
    };
  })();

  /* ------------------------------------------------------------------ *
   * 3. Intro and loading
   * ------------------------------------------------------------------ */

  function renderIntro() {
    clearTimers();
    if (phone) { phone.destroy(); phone = null; }
    s.phase = 'intro';
    clear(root);

    var bestChip = null;
    if (typeof App.state.best === 'number') {
      bestChip = chip(null, 'Your best: ' + App.state.best + ' / 100', 'star');
    }

    var begin = h('button', { class: 'btn btn--primary', type: 'button' }, 'Begin');
    begin.addEventListener('click', startSession);

    root.appendChild(h('div', { class: 'drill-intro' }, [
      h('h1', { class: 'h1', tabindex: '-1' }, 'The drill'),
      h('p', { class: 'lede' }, '10 situations. Pick what you would really do. Points: 10 for the best answer, partial credit for safe-but-incomplete ones, 0 for risky ones.'),
      bestChip,
      h('div', { class: 'btn-row' }, begin),
      h('p', { class: 'body-small muted drill-intro__note' },
        'New situations are written by the local Ollama model when it is running. If it is not, you play the built-in set. Nothing leaves this device.')
    ]));
  }

  function renderLoading() {
    clearTimers();
    if (phone) { phone.destroy(); phone = null; }
    s.phase = 'loading';
    clear(root);
    var token = sessionToken;

    var status = h('p', { class: 'body-small muted', role: 'status', 'aria-live': 'polite' }, 'Contacting the local model.');
    var skip = h('button', { class: 'btn btn--secondary', type: 'button' }, 'Use the built-in set');
    skip.addEventListener('click', function () {
      if (token !== sessionToken) { return; }
      sessionToken += 1;
      AI.cancel();
      clearTimers();
      begin(bundledResult('You skipped local generation. This drill uses the built-in set.'));
    });

    root.appendChild(h('div', { class: 'drill-loading' }, [
      h('h1', { class: 'h1', tabindex: '-1' }, 'Preparing your drill'),
      h('p', { class: 'lede' }, 'Asking your local model for ten new situations. This can take a few minutes on a laptop, so you can start with the built-in set at any time. Scenarios that arrive before the time limit are still used.'),
      h('div', { class: 'load-track', 'aria-hidden': 'true' }, h('span')),
      status,
      h('div', { class: 'btn-row' }, skip),
      h('p', { class: 'body-small muted mt-4' }, 'Nothing is sent anywhere except to your own Ollama instance on this computer.')
    ]));

    var startedAt = Date.now();
    var stage = 'Contacting the local model';
    var paintStatus = function () {
      var seconds = Math.round((Date.now() - startedAt) / 1000);
      status.textContent = stage + '. ' + seconds + 's elapsed.';
    };
    paintStatus();
    ticker = window.setInterval(paintStatus, 500);

    if (window.SCAM_DRILL_AI === false) {
      later(function () {
        if (token !== sessionToken) { return; }
        begin(bundledResult('Local generation is switched off. This drill uses the built-in set.'));
      }, 150);
      return;
    }

    generation = AI.generate(function (nextStage) {
      if (token !== sessionToken) { return; }
      stage = nextStage;
      paintStatus();
    });

    generation.promise.then(function (result) {
      if (token !== sessionToken) { return; }
      clearTimers();
      begin(result);
    });
  }

  function bundledResult(notice) {
    var bank = App.shuffle(window.SCENARIOS || []).slice(0, 10);
    return { rounds: AI.prepare(bank), source: 'bundled', notice: notice };
  }

  /* Start a brand new session: ten new situations, fresh score. */
  function startSession() {
    if (!root) { return; }
    clearTimers();
    if (phone) { phone.destroy(); phone = null; }
    sessionToken += 1;
    s.previousBest = typeof App.state.best === 'number' ? App.state.best : null;
    s.phase = 'loading';
    renderLoading();
  }

  function begin(result) {
    clearTimers();
    if (phone) { phone.destroy(); phone = null; }
    s.rounds = result.rounds || [];
    s.index = 0;
    s.score = 0;
    s.answers = [];
    s.source = result.source || 'bundled';
    s.notice = result.notice || '';
    s.phase = 'play';
    renderRound(true);
  }

  /* ------------------------------------------------------------------ *
   * 4. Play
   * ------------------------------------------------------------------ */

  function sourceLine() {
    if (s.source === 'ai') { return 'Ten new situations from your local model.'; }
    if (s.source === 'mixed') { return 'Partly local-model situations, partly built-in.'; }
    return 'Built-in situations.';
  }

  function renderRound(focusTitle) {
    clearTimers();
    if (phone) { phone.destroy(); phone = null; }
    if (!s.rounds.length) { renderIntro(); return; }

    var scenario = s.rounds[s.index];
    answered = false;
    choicesReady = false;
    clear(root);

    var segments = [];
    for (var i = 0; i < s.rounds.length; i++) {
      var state = 'todo';
      if (i < s.index && s.answers[i]) { state = s.answers[i].verdict; }
      if (i === s.index) { state = 'current'; }
      segments.push(h('span', { class: 'progress__seg', dataset: { state: state } }));
    }
    currentSeg = segments[s.index];

    scoreEl = h('strong', { text: String(s.score) });

    var progressBar = h('div', {
      class: 'progress',
      role: 'progressbar',
      'aria-label': 'Drill progress',
      'aria-valuemin': '0',
      'aria-valuemax': String(s.rounds.length),
      'aria-valuenow': String(s.index)
    }, segments);

    var head = h('div', { class: 'drill-head' }, [
      h('div', { class: 'drill-head__top' }, [
        h('p', { class: 'label' }, 'Round ' + (s.index + 1) + ' of ' + s.rounds.length),
        chip(null, scenario.category),
        h('p', { class: 'drill-score' }, ['Score ', scoreEl])
      ]),
      progressBar,
      h('p', { class: 'drill-meta' }, sourceLine())
    ]);

    choicesEl = h('div', { class: 'choices', role: 'group', 'aria-label': 'Answer choices' });
    var buttons = scenario.choices.map(function (choice, index) {
      var button = h('button', {
        class: 'choice',
        type: 'button',
        disabled: true,
        'aria-label': 'Option ' + 'ABCD'.charAt(index) + ': ' + choice.text
      }, [
        h('span', { class: 'choice__key', 'aria-hidden': 'true' }, 'ABCD'.charAt(index)),
        h('span', { class: 'choice__text' }, choice.text),
        h('span', { class: 'choice__verdict' })
      ]);
      button.addEventListener('click', function () { choose(index); });
      choicesEl.appendChild(button);
      return button;
    });

    phone = App.createPhone(scenario);

    var title = h('h2', { class: 'h2 scenario-title', tabindex: '-1' }, scenario.title);

    var main = h('div', { class: 'drill-main' }, [
      head,
      title,
      h('p', { class: 'scenario-context' }, scenario.context),
      h('h3', { class: 'h3' }, scenario.question),
      choicesEl
    ]);

    root.appendChild(h('h1', { class: 'sr-only' }, 'The drill, round ' + (s.index + 1) + ' of ' + s.rounds.length));
    root.appendChild(h('div', { class: 'drill-grid' }, [
      h('div', { class: 'drill-phone' }, phone.el),
      main
    ]));

    if (focusTitle) {
      later(function () {
        try { title.focus({ preventScroll: true }); } catch (err) { title.focus(); }
      }, 30);
    }

    phone.showMessages(function () {
      buttons.forEach(function (button) { button.disabled = false; });
      choicesReady = true;
      choicesEl.classList.add('is-in');
    }, true);
  }

  /* Apply an answer: lock the choices, score it, mark the flags, show feedback. */
  function choose(index) {
    if (!choicesReady || answered || s.phase !== 'play') { return; }
    var scenario = s.rounds[s.index];
    var choice = scenario.choices[index];
    if (!choice) { return; }

    answered = true;
    s.phase = 'feedback';

    var verdict = choice.verdict;
    var points = verdict === 'best' ? 10 : verdict === 'partial' ? choice.points : 0;

    s.score += points;
    s.answers.push({
      id: scenario.id,
      category: scenario.category,
      title: scenario.title,
      choiceId: choice.id,
      verdict: verdict,
      points: points,
      difficulty: scenario.difficulty || 'medium'
    });

    var buttons = Array.prototype.slice.call(choicesEl.querySelectorAll('.choice'));
    buttons.forEach(function (button, i) {
      button.disabled = true;
      var choiceHere = scenario.choices[i];
      if (i === index) {
        button.dataset.verdict = choiceHere.verdict;
        var meta = App.verdicts[choiceHere.verdict];
        var badge = button.querySelector('.choice__verdict');
        badge.appendChild(icon(meta.icon, 16));
        badge.appendChild(document.createTextNode(meta.label));
      } else if (choiceHere.verdict === 'best') {
        button.classList.add('is-best-outline');
      } else {
        button.classList.add('is-dim');
      }
    });

    if (currentSeg) {
      currentSeg.dataset.state = verdict;
      currentSeg.classList.add('is-new');
    }
    var bar = root.querySelector('.progress');
    if (bar) { bar.setAttribute('aria-valuenow', String(s.index + 1)); }
    if (scoreEl) { App.countUp(scoreEl, s.score, 400); }

    later(function () {
      if (phone) { phone.markFlags(); }
      showFeedback(scenario, choice, verdict, points);
    }, 300);
  }

  function showFeedback(scenario, choice, verdict, points) {
    var meta = App.verdicts[verdict];
    var onlyGreen = scenario.flags.some(function (f) { return f.type === 'green'; }) &&
      !scenario.flags.some(function (f) { return f.type !== 'green'; });
    var isLast = s.index === s.rounds.length - 1;

    var flagRows = scenario.flags.map(function (flag) {
      return h('div', { class: 'flag-row' }, [
        h('p', { class: 'flag-row__phrase' },
          h('span', { class: 'flag on' + (flag.type === 'green' ? ' safe' : '') }, flag.phrase)),
        h('p', { class: 'flag-row__why' }, flag.why)
      ]);
    });

    var next = h('button', { class: 'btn btn--primary', type: 'button' }, isLast ? 'See results' : 'Next');
    next.addEventListener('click', nextRound);

    var card = h('article', { class: 'feedback', 'aria-live': 'polite' }, [
      h('div', { class: 'feedback__head' }, [
        chip(meta.chipKind, meta.label, meta.icon),
        points > 0 ? h('span', { class: 'points-chip', 'aria-hidden': 'true' }, '+' + points) : null
      ]),
      h('p', { class: 'feedback__text' }, choice.feedback),
      h('h3', null, onlyGreen ? 'What made it genuine' : 'What gave it away'),
      h('div', { class: 'flag-stack' }, flagRows),
      h('div', { class: 'golden' }, [
        h('p', { class: 'label' }, 'Golden rule'),
        h('p', { class: 'golden__text' }, scenario.goldenRule)
      ]),
      h('div', { class: 'btn-row' }, next)
    ]);

    var main = root.querySelector('.drill-main');
    if (main) { main.appendChild(card); }
  }

  function nextRound() {
    if (s.index >= s.rounds.length - 1) { renderResults(); return; }
    s.index += 1;
    s.phase = 'play';
    renderRound(true);
  }

  /* ------------------------------------------------------------------ *
   * 5. Results and badges
   * ------------------------------------------------------------------ */

  var BADGES = [
    { id: 'perfect', name: 'Perfect drill', rule: 'Every round answered with the best choice.' },
    { id: 'otp', name: 'OTP guardian', rule: 'Best answer on both OTP situations.' },
    { id: 'upi', name: 'UPI pro', rule: 'Best answer on both the collect-request and QR situations.' },
    { id: 'calm', name: 'Cool head', rule: 'Best answer on the digital arrest situation.' },
    { id: 'streak', name: 'Five in a row', rule: 'Five best answers in a row.' },
    { id: 'reborn', name: 'Second attempt', rule: 'Beat your previous best by at least 10 points.' }
  ];

  function rankFor(score) {
    if (score >= 90) {
      return { name: 'Scam-proof', kind: 'safe', level: 'Low risk', icon: 'check', sentence: 'You spotted almost every trick. Teach someone else what you learned.' };
    }
    if (score >= 60) {
      return { name: 'Alert', kind: 'suspicious', level: 'Medium risk', icon: 'alert', sentence: 'You catch most scams. Review the rounds you missed.' };
    }
    return { name: 'At risk', kind: 'scam', level: 'High risk', icon: 'x', sentence: 'These tricks work on many people. Replay, and read the Learn section.' };
  }

  function earnedBadges(total) {
    var earned = [];
    var answers = s.answers;
    if (answers.length && answers.every(function (a) { return a.verdict === 'best'; })) { earned.push('perfect'); }

    var verdicts = {};
    answers.forEach(function (a) { verdicts[a.id] = a.verdict; });
    if (verdicts['fraud-team-call'] === 'best' && verdicts['genuine-otp'] === 'best') { earned.push('otp'); }
    if (verdicts['upi-collect'] === 'best' && verdicts['qr-receive'] === 'best') { earned.push('upi'); }
    if (verdicts['digital-arrest'] === 'best') { earned.push('calm'); }

    var run = 0;
    var streak = false;
    answers.forEach(function (a) {
      run = a.verdict === 'best' ? run + 1 : 0;
      if (run >= 5) { streak = true; }
    });
    if (streak) { earned.push('streak'); }

    if (typeof s.previousBest === 'number' && total >= s.previousBest + 10) { earned.push('reborn'); }
    return earned;
  }

  function storeBadges(ids) {
    var stored = App.storage.get('badges', []);
    if (!Array.isArray(stored)) { stored = []; }
    var merged = stored.slice();
    ids.forEach(function (id) { if (merged.indexOf(id) < 0) { merged.push(id); } });
    App.storage.set('badges', merged);
    return merged;
  }

  function renderResults() {
    clearTimers();
    if (phone) { phone.destroy(); phone = null; }
    s.phase = 'results';

    var total = s.answers.reduce(function (sum, a) { return sum + a.points; }, 0);
    var rank = rankFor(total);
    var newlyEarned = earnedBadges(total);
    var allEarned = storeBadges(newlyEarned);

    if (typeof App.state.best !== 'number' || total > App.state.best) {
      App.state.best = total;
      App.storage.set('best', total);
    }

    clear(root);

    var scoreNumber = h('p', { class: 'number-xl', text: '0' });

    var left = h('div', { class: 'results__left' }, [
      h('p', { class: 'eyebrow' }, 'Your result'),
      h('div', { class: 'results__rankline' }, [
        h('h1', { class: 'h1 rank-name', tabindex: '-1' }, rank.name),
        chip(rank.kind, rank.level, rank.icon)
      ]),
      h('div', { class: 'results__score' }, [scoreNumber, h('span', { class: 'denom' }, '/ 100')]),
      h('p', { class: 'results__sentence' }, rank.sentence),
      s.notice ? h('p', { class: 'body-small muted mt-5' }, s.notice) : null
    ]);

    var reviewList = h('div', { role: 'list', 'aria-label': 'Round by round review' });
    s.answers.forEach(function (answer, i) {
      var scenario = s.rounds.filter(function (r) { return r.id === answer.id; })[0] || {};
      var meta = App.verdicts[answer.verdict];
      var wrap = h('div', { class: 'review', role: 'listitem' });
      var panelId = 'review-panel-' + i;

      var row = h('button', {
        class: 'review__row',
        type: 'button',
        'aria-expanded': 'false',
        'aria-controls': panelId
      }, [
        h('span', { class: 'review__title' }, answer.title),
        h('span', { class: 'review__verdict', dataset: { verdict: answer.verdict } }, [
          icon(meta.icon, 16),
          meta.label
        ]),
        h('span', { class: 'review__points' }, [
          answer.points + ' pt',
          h('span', { class: 'review__chevron' }, icon('chevron', 16))
        ])
      ]);

      var panel = h('div', { class: 'review__panel', id: panelId }, h('div', null,
        h('div', { class: 'review__panel-body' }, [
          h('p', { class: 'review__meta' }, 'Difficulty: ' + (scenario.difficulty || answer.difficulty || 'medium')),
          h('p', { class: 'review__lesson' }, scenario.lesson || ''),
          scenario.explanation ? h('p', { class: 'review__rule' }, scenario.explanation) : null,
          h('p', { class: 'review__rule' }, 'Golden rule: ' + (scenario.goldenRule || ''))
        ])
      ));

      row.addEventListener('click', function () {
        var open = wrap.classList.toggle('is-open');
        row.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      wrap.appendChild(row);
      wrap.appendChild(panel);
      reviewList.appendChild(wrap);
    });

    var badgeTiles = BADGES.map(function (badge) {
      var earned = allEarned.indexOf(badge.id) > -1;
      var tile = h('div', {
        class: 'badge' + (earned ? '' : ' is-locked'),
        role: 'listitem',
        title: badge.rule,
        'aria-label': badge.name + (earned ? ', earned' : ', locked. ' + badge.rule)
      }, [
        icon(earned ? App.badgeIcons[badge.id] : 'lock', 32),
        h('span', { class: 'badge__label' }, badge.name)
      ]);
      return tile;
    });

    var playAgain = h('button', { class: 'btn btn--primary', type: 'button' }, 'Play again');
    playAgain.addEventListener('click', startSession);

    var copyButton = h('button', { class: 'btn btn--secondary', type: 'button' }, [
      icon('copy', 18),
      'Copy my score'
    ]);
    var copyStatus = h('p', { class: 'body-small muted', role: 'status', 'aria-live': 'polite' });

    copyButton.addEventListener('click', function () {
      var sentence = 'I scored ' + total + '/100 on Scam Drill. Can you beat me?';
      copyStatus.textContent = '';
      var existing = copyStatus.parentNode.querySelector('.results__copy input');
      if (existing) { existing.parentNode.removeChild(existing.parentNode); }
      var done = function () { copyStatus.textContent = 'Copied. Paste it anywhere.'; };
      var fallback = function () {
        copyStatus.textContent = 'Copy failed. Select the text below and copy it yourself.';
        var field = h('input', { type: 'text', readonly: true, value: sentence, 'aria-label': 'Your score sentence' });
        var holder = h('div', { class: 'results__copy' }, field);
        copyStatus.parentNode.insertBefore(holder, copyStatus);
        field.focus();
        field.select();
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(sentence).then(done, fallback);
        } else {
          fallback();
        }
      } catch (err) { fallback(); }
    });

    var checkerLink = h('a', { class: 'btn btn--ghost', href: '#checker' }, 'Check a message');

    var badgesSection = h('section', { class: 'badges mt-5', 'aria-labelledby': 'badges-title' }, [
      h('h2', { class: 'h2', id: 'badges-title' }, 'Badges'),
      h('div', { class: 'badges__grid', role: 'list' }, badgeTiles)
    ]);

    root.appendChild(h('div', { class: 'drill-results' }, [
      h('div', { class: 'results-grid' }, [left, reviewList]),
      badgesSection,
      h('div', { class: 'results__actions mt-5' }, [playAgain, copyButton, checkerLink]),
      copyStatus
    ]));

    var heading = root.querySelector('h1');
    if (heading) {
      try { heading.focus({ preventScroll: true }); } catch (err) { heading.focus(); }
    }

    App.countUp(scoreNumber, total, 900);
  }

  /* ------------------------------------------------------------------ *
   * 6. Keyboard answers and boot
   * ------------------------------------------------------------------ */

  function onKeydown(event) {
    if (s.phase !== 'play' || !choicesReady || answered) { return; }
    if (event.ctrlKey || event.metaKey || event.altKey) { return; }
    var view = document.getElementById('view-drill');
    if (!view || view.hidden) { return; }
    var tag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || (event.target && event.target.isContentEditable)) { return; }
    var key = String(event.key || '').toLowerCase();
    var index = ['a', 'b', 'c', 'd'].indexOf(key);
    if (index < 0) { index = ['1', '2', '3', '4'].indexOf(key); }
    if (index < 0) { return; }
    event.preventDefault();
    choose(index);
  }

  function init() {
    root = document.getElementById('drill-root');
    if (!root) { return; }
    document.addEventListener('keydown', onKeydown);
    if (s.phase === 'play' || s.phase === 'feedback') { renderRound(false); }
    else if (s.phase === 'results') { renderResults(); }
    else { renderIntro(); }
  }

  App.game = {
    init: init,
    startSession: startSession,
    generate: function (onStatus) { return AI.generate(onStatus); },
    validateBatch: AI.validateBatch
  };
})();
