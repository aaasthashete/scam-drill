/*
  Scam Drill - message checker
  Runs window.ScamChecker.analyze() locally. Pasted text is never stored,
  never sent anywhere and never inserted as HTML.
*/
(function () {
  'use strict';

  var App = window.App;
  var h = App.h;
  var icon = App.icon;
  var clear = App.clear;
  var chip = App.chip;

  var MAX_CHARS = 2000;
  var MIN_CHARS = 8;

  var SAMPLES = [
    { label: 'KYC SMS', text: 'Dear Customer, your Navbharat Bank account will be BLOCKED today. Complete KYC immediately: http://navbharat-kyc.co.in/update' },
    { label: 'Fake refund', text: 'Your QuickBite refund of Rs 349 has failed. Please install the QuickSupport app from the link and share the 9-digit code shown on your screen.' },
    { label: 'Lucky draw', text: 'CONGRATULATIONS! You have won Rs 25,00,000 in the Mega Diwali Lucky Draw. Pay Rs 4,500 GST charges to claim your prize today.' },
    { label: 'Genuine OTP', text: '482913 is your OTP for Rs 1,299 payment to ShopKart. Do not share it with anyone. Valid for 10 minutes. -Navbharat Bank' }
  ];

  var ui = null;
  var started = false;

  /* ---------------------------------------------------------------- *
   * Build the fixed parts of the screen once.
   * ---------------------------------------------------------------- */

  function build() {
    var root = document.getElementById('checker-root');
    if (!root) { return false; }

    var input = h('textarea', {
      class: 'message-input',
      id: 'checker-text',
      rows: '8',
      spellcheck: 'false',
      placeholder: 'Paste the message here, for example: Dear Customer, your account will be blocked today...',
      'aria-describedby': 'checker-count checker-help'
    });

    var count = h('span', { class: 'checker__count', id: 'checker-count' }, '0 / 2000');
    var shortened = h('p', { class: 'body-small muted', hidden: true }, 'Message shortened to 2,000 characters.');
    var error = h('p', { class: 'checker-error', role: 'alert', hidden: true });

    var checkButton = h('button', { class: 'btn btn--primary', type: 'button', 'aria-disabled': 'true' }, 'Check message');
    var clearButton = h('button', { class: 'btn btn--ghost', type: 'button' }, 'Clear');

    var sampleRow = h('div', { class: 'samples__row' });
    SAMPLES.forEach(function (sample) {
      var button = h('button', { class: 'btn btn--ghost', type: 'button' }, sample.label);
      button.addEventListener('click', function () {
        input.value = sample.text;
        updateCount();
        updateCheckState();
        clear(error);
        error.hidden = true;
        input.focus();
      });
      sampleRow.appendChild(button);
    });

    var inputColumn = h('div', { class: 'checker-input' }, [
      h('label', { class: 'label', for: 'checker-text' }, 'Your message'),
      input,
      count,
      shortened,
      h('div', { class: 'checker__actions' }, [checkButton, clearButton]),
      error,
      h('div', { class: 'samples', id: 'checker-help' }, [
        h('p', { class: 'label samples__label' }, 'Try a sample'),
        sampleRow
      ])
    ]);

    var resultBox = h('div', { class: 'checker-result', 'aria-live': 'polite' });

    var empty = h('div', { class: 'empty-state' }, [
      h('span', { class: 'empty-state__icon' }, icon('search', 48)),
      h('p', { class: 'label' }, 'No message checked yet'),
      h('p', null, 'Your result will appear here. Paste a message and press Check message.')
    ]);
    resultBox.appendChild(empty);

    root.appendChild(h('div', { class: 'page' }, [
      h('div', { class: 'page__head' }, [
        h('h1', { class: 'h1', tabindex: '-1' }, 'Check a message'),
        h('p', { class: 'lede' }, 'Paste an SMS or WhatsApp message. Scam Drill looks for the tricks scammers use. It runs on your device and sends nothing anywhere.')
      ]),
      h('div', { class: 'checker-grid' }, [inputColumn, resultBox])
    ]));

    ui = {
      input: input,
      count: count,
      shortened: shortened,
      error: error,
      checkButton: checkButton,
      resultBox: resultBox
    };

    function updateCount() {
      var length = ui.input.value.length;
      ui.count.textContent = length + ' / ' + MAX_CHARS;
    }

    function nonSpaceLength() {
      return ui.input.value.replace(/\s+/g, '').length;
    }

    function updateCheckState() {
      if (nonSpaceLength() >= MIN_CHARS) {
        ui.checkButton.removeAttribute('aria-disabled');
      } else {
        ui.checkButton.setAttribute('aria-disabled', 'true');
      }
    }

    input.addEventListener('input', function () {
      if (input.value.length > MAX_CHARS) {
        input.value = input.value.slice(0, MAX_CHARS);
        ui.shortened.hidden = false;
      } else {
        ui.shortened.hidden = true;
      }
      updateCount();
      updateCheckState();
      if (!ui.error.hidden) { ui.error.hidden = true; }
    });

    checkButton.addEventListener('click', analyzeNow);

    clearButton.addEventListener('click', function () {
      input.value = '';
      updateCount();
      updateCheckState();
      clear(error);
      error.hidden = true;
      ui.shortened.hidden = true;
      clear(ui.resultBox);
      ui.resultBox.appendChild(empty);
      input.focus();
    });

    updateCount();
    updateCheckState();
    return true;
  }

  /* ---------------------------------------------------------------- *
   * Checking and rendering
   * ---------------------------------------------------------------- */

  function showError(message) {
    clear(ui.error);
    ui.error.appendChild(document.createTextNode(message));
    ui.error.hidden = false;
  }

  function analyzeNow() {
    if (!ui) { return; }
    var text = ui.input.value;
    if (text.replace(/\s+/g, '').length < MIN_CHARS) {
      showError('Paste a message first, then press Check message.');
      ui.input.focus();
      return;
    }
    ui.error.hidden = true;
    if (!window.ScamChecker || typeof window.ScamChecker.analyze !== 'function') {
      showError('The checker could not load. Reload the page and try again.');
      return;
    }

    var result;
    try {
      result = window.ScamChecker.analyze(text);
    } catch (err) {
      showError('The checker could not read this message. Try again with plain text.');
      return;
    }
    renderResult(result, text);
  }

  function levelChip(result) {
    if (result.level === 'high') { return chip('scam', 'High risk', 'x'); }
    if (result.level === 'medium') { return chip('suspicious', 'Medium risk', 'alert'); }
    return chip('safe', 'Low risk', 'check');
  }

  /* Merge spans from every match, preferring the higher-weight match on overlap. */
  function markedText(text, matches) {
    var spans = [];
    matches.forEach(function (match) {
      (match.spans || []).forEach(function (span) {
        if (span.start >= 0 && span.end <= text.length && span.end > span.start) {
          spans.push({ start: span.start, end: span.end, severity: match.severity, weight: match.weight });
        }
      });
    });
    spans.sort(function (a, b) { return a.start - b.start || b.weight - a.weight; });

    var accepted = [];
    var cursor = 0;
    spans.forEach(function (span) {
      if (span.start >= cursor) { accepted.push(span); cursor = span.end; }
    });

    var frag = document.createDocumentFragment();
    var pos = 0;
    accepted.forEach(function (span) {
      if (span.start > pos) { frag.appendChild(document.createTextNode(text.slice(pos, span.start))); }
      var mark = document.createElement('span');
      mark.className = 'mark mark--' + span.severity;
      mark.textContent = text.slice(span.start, span.end);
      frag.appendChild(mark);
      pos = span.end;
    });
    if (pos < text.length) { frag.appendChild(document.createTextNode(text.slice(pos))); }
    return frag;
  }

  function renderResult(result, text) {
    clear(ui.resultBox);

    var scoreNumber = h('strong', { text: '0' });
    var marker = h('span', { class: 'meter__marker', 'aria-hidden': 'true' });
    marker.style.left = '2%';

    var meter = h('div', {
      class: 'meter',
      role: 'meter',
      'aria-label': 'Risk score out of 100',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': String(result.score),
      'aria-valuetext': result.score + ' out of 100, ' + result.verdict
    }, [
      h('span', { class: 'meter__zone meter__zone--safe' }),
      h('span', { class: 'meter__zone meter__zone--warn' }),
      h('span', { class: 'meter__zone meter__zone--danger' }),
      marker
    ]);

    var scoreLine = h('p', { class: 'body-small muted' }, ['Risk score ', scoreNumber, ' / 100']);

    var labels = h('div', { class: 'meter__labels', 'aria-hidden': 'true' }, [
      h('span', { style: { left: '0%' } }, 'Low'),
      h('span', { style: { left: '30%' } }, 'Suspicious'),
      h('span', { style: { left: '60%' } }, 'Likely scam')
    ]);

    var marked = h('div', { class: 'marked' });
    marked.appendChild(markedText(text, result.matches));

    var reasons = h('div');
    if (result.notes && result.notes.length) {
      var notes = h('div', { class: 'note mb-4' });
      result.notes.forEach(function (note, i) {
        notes.appendChild(h('p', i === 0 ? null : { class: 'mt-4' }, note));
      });
      reasons.appendChild(notes);
    }

    if (result.matches.length) {
      reasons.appendChild(h('h3', { class: 'h3 checker__block-title' }, 'Warning signs found'));
      result.matches.forEach(function (match) {
        var severity = match.severity === 'high' ? 'scam' : match.severity === 'medium' ? 'suspicious' : null;
        reasons.appendChild(h('div', { class: 'reason' }, [
          chip(severity, match.severity === 'high' ? 'High' : match.severity === 'medium' ? 'Medium' : 'Low',
            match.severity === 'high' ? 'x' : match.severity === 'medium' ? 'alert' : 'info'),
          h('p', { class: 'reason__label' }, match.label),
          h('p', { class: 'reason__why' }, match.why)
        ]));
      });
    } else {
      reasons.appendChild(h('p', { class: 'body-small muted' }, 'No individual warning signs found in the text.'));
    }

    ui.resultBox.appendChild(h('div', { class: 'card' }, [
      scoreLine,
      meter,
      labels,
      h('h2', { class: 'checker__verdict', dataset: { level: result.level }, tabindex: '-1' }, result.verdict),
      h('div', { class: 'mb-4' }, levelChip(result)),
      h('p', { class: 'checker__summary' }, result.summary),
      h('h3', { class: 'h3 checker__block-title' }, 'The message, marked up'),
      marked,
      reasons,
      h('p', { class: 'checker__disclaimer' }, 'This is a pattern check, not a guarantee. If a message asks for money, a code or a link click, confirm through the official app.')
    ]));

    var verdictHeading = ui.resultBox.querySelector('.checker__verdict');
    if (verdictHeading) {
      try { verdictHeading.focus({ preventScroll: true }); } catch (err) { verdictHeading.focus(); }
    }

    App.countUp(scoreNumber, result.score, 700);
    var position = 1 + (Math.max(0, Math.min(100, result.score)) / 100) * 98;
    if (App.reducedMotion()) {
      marker.style.left = position + '%';
    } else {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { marker.style.left = position + '%'; });
      });
    }
  }

  /* ---------------------------------------------------------------- *
   * Boot
   * ---------------------------------------------------------------- */

  function init() {
    if (started) { return; }
    started = build();
  }

  App.checker = { init: init };
})();
