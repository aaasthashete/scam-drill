/*
  Scam Drill - app shell
  Helpers, safe DOM building, icons, storage, theme, router and the phone mock
  shared by Home and the Drill. Classic script: everything hangs off window.App.
*/
(function () {
  'use strict';

  var App = window.App = window.App || {};

  /* ---------------------------------------------------------------- *
   * 1. Safe DOM helpers
   * ---------------------------------------------------------------- */

  /* Append text, nodes or arrays of children without ever parsing HTML. */
  function append(el, child) {
    if (child === null || child === undefined || child === false) { return; }
    if (Array.isArray(child)) {
      for (var i = 0; i < child.length; i++) { append(el, child[i]); }
      return;
    }
    if (child instanceof Node) { el.appendChild(child); return; }
    el.appendChild(document.createTextNode(String(child)));
  }

  /*
    h('div', { class: 'x', text: 'hi' }, child, [more])
    attrs: class, text, dataset, style, any attribute. Text always goes in as text.
  */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (key) {
      var value = a[key];
      if (value === null || value === undefined || value === false) { return; }
      if (key === 'class') { el.className = value; }
      else if (key === 'text') { el.textContent = value; }
      else if (key === 'dataset') {
        Object.keys(value).forEach(function (dataKey) { el.dataset[dataKey] = value[dataKey]; });
      } else if (key === 'style') {
        Object.keys(value).forEach(function (prop) { el.style.setProperty(prop, value[prop]); });
      } else if (value === true) { el.setAttribute(key, ''); }
      else { el.setAttribute(key, String(value)); }
    });
    for (var i = 2; i < arguments.length; i++) { append(el, arguments[i]); }
    return el;
  }

  /* Remove every child of a node. */
  function clear(el) {
    while (el && el.firstChild) { el.removeChild(el.firstChild); }
  }

  /* ---------------------------------------------------------------- *
   * 2. Icons (inline SVG, 2px stroke, round caps)
   * ---------------------------------------------------------------- */

  var ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M19.1 4.9l-1.5 1.5M6.4 17.6l-1.5 1.5"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    alert: '<path d="M12 4 3 20h18Z"/><path d="M12 10v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 8h.01"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m15.8 15.8 4.2 4.2"/>',
    shield: '<path d="M12 3.2 20 6v5.4c0 4.4-3.2 7.7-8 9.4-4.8-1.7-8-5-8-9.4V6Z"/>',
    star: '<path d="m12 3.5 2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.9l6.1-.8Z"/>',
    key: '<circle cx="8" cy="8" r="4.4"/><path d="m11.3 11.3 8.7 8.7M16 16l1.8-1.8M18.8 18.8 20.6 17"/>',
    qr: '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><path d="M13.5 13.5h3v3M20.5 13.5v7h-7"/>',
    zap: '<path d="M13.2 2.5 4.8 13.4H11l-.2 8.1 8.4-10.9H13Z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.4 6.3"/><path d="M20 4.5V11h-6.5"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.6A1.6 1.6 0 0 0 13.4 4H5.6A1.6 1.6 0 0 0 4 5.6v7.8A1.6 1.6 0 0 0 5.6 15"/>',
    phone: '<path d="M6.1 3.6h3l1.5 3.9-2 1.4a12.4 12.4 0 0 0 6.5 6.5l1.4-2 3.9 1.5v3a2 2 0 0 1-2.2 2A17.2 17.2 0 0 1 4.1 5.8a2 2 0 0 1 2-2.2Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    doc: '<path d="M6 3.5h7l5 5v12H6Z"/><path d="M13 3.5v5h5"/>',
    battery: '<rect x="2" y="7.5" width="16" height="9" rx="2.5"/><path d="M21.5 10.5v3"/><path d="M4.5 10.2v3.6" stroke-width="3.4"/>'
  };

  /* Build an icon span. Only the static strings above are ever set as HTML. */
  function icon(name, size) {
    var px = size || 20;
    var span = h('span', { class: 'icon', 'aria-hidden': 'true' });
    span.innerHTML = '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[name] || '') + '</svg>';
    return span;
  }

  /* ---------------------------------------------------------------- *
   * 3. Small shared builders
   * ---------------------------------------------------------------- */

  function chip(kind, label, iconName) {
    var el = h('span', { class: kind ? 'chip chip--' + kind : 'chip' });
    if (iconName) { el.appendChild(icon(iconName, 14)); }
    el.appendChild(document.createTextNode(label));
    return el;
  }

  var VERDICTS = {
    best: { label: 'Best answer', icon: 'check', chipKind: 'safe' },
    partial: { label: 'Partly right', icon: 'minus', chipKind: 'suspicious' },
    bad: { label: 'Risky choice', icon: 'x', chipKind: 'scam' }
  };

  var BADGE_ICONS = { perfect: 'star', otp: 'key', upi: 'qr', calm: 'shield', streak: 'zap', reborn: 'refresh' };

  /* ---------------------------------------------------------------- *
   * 4. Storage (always inside try/catch)
   * ---------------------------------------------------------------- */

  var storage = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem('scamdrill.' + key);
        if (raw === null) { return fallback; }
        return JSON.parse(raw);
      } catch (err) { return fallback; }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem('scamdrill.' + key, JSON.stringify(value));
        return true;
      } catch (err) { return false; }
    }
  };

  /* ---------------------------------------------------------------- *
   * 5. Misc helpers
   * ---------------------------------------------------------------- */

  /* Fisher-Yates shuffle on a copy. */
  function shuffle(list) {
    var out = (list || []).slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function reducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (err) { return false; }
  }

  /* Count a number up inside an element. */
  function countUp(el, to, duration) {
    if (!el) { return; }
    var target = Math.round(to);
    if (reducedMotion() || duration <= 0) { el.textContent = String(target); return; }
    var from = parseInt(el.textContent, 10);
    if (isNaN(from)) { from = 0; }
    var start = null;
    function frame(now) {
      if (start === null) { start = now; }
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(from + (target - from) * eased));
      if (p < 1) { window.requestAnimationFrame(frame); }
    }
    window.requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------- *
   * 6. Phone mock
   * ---------------------------------------------------------------- */

  var CHANNELS = {
    sms: { line: 'Messages', chip: 'SMS' },
    whatsapp: { line: 'WhatsApp', chip: 'WhatsApp' },
    telegram: { line: 'Telegram', chip: 'Telegram' },
    call: { line: 'Incoming call', chip: 'Call' },
    video: { line: 'Video call', chip: 'Video' }
  };

  /* Two letters for the phone avatar, taken from the sender name. */
  function initials(sender) {
    var words = String(sender || '').replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
    var letters = words.filter(function (word) { return /[A-Za-z]/.test(word); });
    if (!letters.length) {
      var digits = String(sender || '').replace(/\D/g, '');
      return digits ? digits.slice(-2) : '##';
    }
    return letters.slice(0, 2).map(function (word) { return word.charAt(0).toUpperCase(); }).join('');
  }

  /*
    Wrap every flag phrase found in a message in <span class="flag">, built from
    text nodes only. Overlapping phrases keep the earlier one; missing phrases
    are skipped silently.
  */
  function markText(text, flags) {
    var frag = document.createDocumentFragment();
    var ranges = [];
    (flags || []).forEach(function (flag, index) {
      var phrase = flag && flag.phrase ? String(flag.phrase) : '';
      if (!phrase) { return; }
      var at = text.indexOf(phrase);
      if (at < 0) { return; }
      ranges.push({ start: at, end: at + phrase.length, green: flag.type === 'green', index: index });
    });
    ranges.sort(function (a, b) { return a.start - b.start || b.end - a.end; });

    var cursor = 0;
    ranges.forEach(function (range) {
      if (range.start < cursor) { return; }
      if (range.start > cursor) { frag.appendChild(document.createTextNode(text.slice(cursor, range.start))); }
      var span = document.createElement('span');
      span.className = 'flag' + (range.green ? ' safe' : '');
      span.style.setProperty('--d', (range.index * 140) + 'ms');
      span.textContent = text.slice(range.start, range.end);
      frag.appendChild(span);
      cursor = range.end;
    });
    if (cursor < text.length) { frag.appendChild(document.createTextNode(text.slice(cursor))); }
    return frag;
  }

  /* Format seconds as m:ss for the call timer. */
  function clockText(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /*
    Build the simulated phone for one scenario.
    Returns { el, showMessages(done, animate), markFlags(), destroy() }.
  */
  function createPhone(scenario) {
    var channel = CHANNELS[scenario.channel] ? scenario.channel : 'sms';
    var meta = CHANNELS[channel];
    var isCall = channel === 'call' || channel === 'video';
    var timers = [];
    var bodies = [];
    var counterId = null;

    var list = h('div', {
      class: 'phone__body',
      role: 'log',
      'aria-label': 'Messages from ' + (scenario.sender || 'unknown sender'),
      dataset: { channel: channel }
    });

    if (isCall) {
      var timer = h('span', { class: 'caller__timer', text: '0:00' });
      var ring = h('div', { class: 'caller__avatar', text: initials(scenario.sender) });
      list.appendChild(h('div', { class: 'caller' }, [
        ring,
        h('p', { class: 'caller__state' }, [
          channel === 'video' ? h('span', { class: 'rec-dot' }) : icon('phone', 16),
          channel === 'video' ? 'Video call' : 'Incoming call'
        ]),
        timer
      ]));
      list.appendChild(h('p', { class: 'label captions-label' }, 'Live captions'));
      var seconds = 0;
      counterId = window.setInterval(function () {
        seconds += 1;
        timer.textContent = clockText(seconds);
      }, 1000);
    }

    var status = h('div', { class: 'phone__status' }, [
      h('span', { text: '9:41' }),
      h('span', { class: 'phone__notch', 'aria-hidden': 'true' }),
      icon('battery', 20)
    ]);

    var el = h('div', { class: 'phone' }, [
      status,
      h('div', { class: 'phone__appbar' }, [
        h('span', { class: 'avatar', 'aria-hidden': 'true', text: initials(scenario.sender) }),
        h('div', { class: 'phone__who' }, [
          h('span', { class: 'phone__name', text: scenario.sender || 'Unknown sender' }),
          h('span', { class: 'phone__channel', text: meta.line })
        ]),
        h('span', { class: 'chip phone__chip', text: meta.chip })
      ]),
      list
    ]);

    function scrollDown() { list.scrollTop = list.scrollHeight; }

    /* One message row: bubble plus timestamp. */
    function makeMessage(message) {
      var text = String(message.text || '');
      var body = h('div', { class: 'bubble' }, text);
      var row = h('div', { class: 'msg msg--enter' }, [
        body,
        message.time ? h('div', { class: 'bubble__time', text: String(message.time) }) : null
      ]);
      bodies.push({ body: body, text: text });
      return row;
    }

    /* Show the messages, either at once or one after another with a typing dot. */
    function showMessages(done, animate) {
      var messages = (scenario.messages || []).slice();
      done = done || function () {};
      if (!messages.length) { done(); return; }
      if (!animate || reducedMotion()) {
        messages.forEach(function (message) { list.appendChild(makeMessage(message)); });
        scrollDown();
        done();
        return;
      }
      var index = 0;
      function step() {
        if (index >= messages.length) { done(); return; }
        var typing = h('div', { class: 'msg' }, h('div', { class: 'typing', 'aria-hidden': 'true' }, [
          h('span'), h('span'), h('span')
        ]));
        list.appendChild(typing);
        scrollDown();
        timers.push(window.setTimeout(function () {
          if (typing.parentNode) { typing.parentNode.removeChild(typing); }
          list.appendChild(makeMessage(messages[index]));
          scrollDown();
          index += 1;
          timers.push(window.setTimeout(step, 450));
        }, 600));
      }
      step();
    }

    /* Sweep the yellow marker over every flag phrase in the bubbles. */
    function markFlags() {
      var flags = scenario.flags || [];
      bodies.forEach(function (entry) {
        clear(entry.body);
        entry.body.appendChild(markText(entry.text, flags));
      });
      var spans = list.querySelectorAll('.flag');
      if (reducedMotion()) {
        Array.prototype.forEach.call(spans, function (span) { span.classList.add('on'); });
        return;
      }
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          Array.prototype.forEach.call(spans, function (span) { span.classList.add('on'); });
        });
      });
    }

    function destroy() {
      timers.forEach(window.clearTimeout);
      timers = [];
      if (counterId !== null) { window.clearInterval(counterId); counterId = null; }
    }

    return { el: el, list: list, showMessages: showMessages, markFlags: markFlags, destroy: destroy };
  }

  /* ---------------------------------------------------------------- *
   * 7. Theme
   * ---------------------------------------------------------------- */

  var themeButton = null;
  var darkQuery = null;

  function currentTheme() {
    if (App.state.theme === 'dark' || App.state.theme === 'light') { return App.state.theme; }
    try {
      return darkQuery && darkQuery.matches ? 'dark' : 'light';
    } catch (err) { return 'light'; }
  }

  function paintThemeButton() {
    if (!themeButton) { return; }
    var dark = currentTheme() === 'dark';
    clear(themeButton);
    themeButton.appendChild(icon(dark ? 'sun' : 'moon', 20));
    themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    themeButton.setAttribute('title', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  function applyTheme(mode, persist) {
    App.state.theme = mode === 'light' || mode === 'dark' ? mode : 'system';
    if (App.state.theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', App.state.theme);
    }
    if (persist) { storage.set('theme', App.state.theme); }
    paintThemeButton();
  }

  function initTheme() {
    themeButton = document.getElementById('theme-toggle');
    try { darkQuery = window.matchMedia('(prefers-color-scheme: dark)'); } catch (err) { darkQuery = null; }
    var saved = storage.get('theme', 'system');
    applyTheme(saved, false);
    if (darkQuery && darkQuery.addEventListener) {
      darkQuery.addEventListener('change', function () {
        if (App.state.theme === 'system') { paintThemeButton(); }
      });
    }
    if (themeButton) {
      themeButton.addEventListener('click', function () {
        applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
      });
    }
  }

  /* ---------------------------------------------------------------- *
   * 8. Router
   * ---------------------------------------------------------------- */

  var VIEW_NAMES = ['home', 'drill', 'checker', 'learn', 'help'];
  var VIEW_TITLES = {
    home: 'Scam Drill - can you spot a scam message?',
    drill: 'Drill | Scam Drill',
    checker: 'Checker | Scam Drill',
    learn: 'Learn | Scam Drill',
    help: 'Help | Scam Drill'
  };
  var views = {};
  var currentView = null;

  function setNavState(name) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (link) {
      if (link.dataset.nav === name) { link.setAttribute('aria-current', 'page'); }
      else { link.removeAttribute('aria-current'); }
    });
  }

  function showView(name, isInitial) {
    if (!views[name]) { name = 'home'; }
    VIEW_NAMES.forEach(function (key) {
      if (views[key]) { views[key].hidden = key !== name; }
    });
    currentView = name;
    setNavState(name);
    document.title = VIEW_TITLES[name] || 'Scam Drill';

    var view = views[name];
    view.classList.remove('view--in');
    void view.offsetWidth;
    view.classList.add('view--in');

    if (!isInitial) {
      window.scrollTo(0, 0);
      var heading = view.querySelector('h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        try { heading.focus({ preventScroll: true }); } catch (err) { heading.focus(); }
      }
    }
  }

  function route(isInitial) {
    var raw = String(window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
    showView(VIEW_NAMES.indexOf(raw) > -1 ? raw : 'home', isInitial);
  }

  function initRouter() {
    VIEW_NAMES.forEach(function (name) { views[name] = document.getElementById('view-' + name); });
    window.addEventListener('hashchange', function () { route(false); });
    route(true);
  }

  /* ---------------------------------------------------------------- *
   * 9. Home hero phone
   * ---------------------------------------------------------------- */

  function initHome() {
    var host = document.getElementById('home-phone');
    if (!host || !window.SCENARIOS || !window.SCENARIOS.length) { return; }
    var scenario = window.SCENARIOS[0];
    var phone = createPhone(scenario);
    host.appendChild(phone.el);
    phone.showMessages(function () { }, false);
    window.setTimeout(function () { phone.markFlags(); }, 600);
  }

  /* ---------------------------------------------------------------- *
   * 10. Boot
   * ---------------------------------------------------------------- */

  App.state = {
    theme: 'system',
    best: null,
    game: {
      phase: 'intro',
      rounds: [],
      index: 0,
      score: 0,
      answers: [],
      source: 'bundled',
      notice: '',
      previousBest: null
    }
  };

  App.h = h;
  App.append = append;
  App.clear = clear;
  App.icon = icon;
  App.chip = chip;
  App.storage = storage;
  App.shuffle = shuffle;
  App.reducedMotion = reducedMotion;
  App.countUp = countUp;
  App.createPhone = createPhone;
  App.markText = markText;
  App.verdicts = VERDICTS;
  App.badgeIcons = BADGE_ICONS;
  App.currentTheme = currentTheme;
  App.showView = showView;

  function boot() {
    var storedBest = storage.get('best', null);
    App.state.best = typeof storedBest === 'number' && isFinite(storedBest) && storedBest >= 0 && storedBest <= 100
      ? Math.round(storedBest) : null;

    initTheme();
    initHome();
    if (App.game && App.game.init) { App.game.init(); }
    if (App.checker && App.checker.init) { App.checker.init(); }
    if (App.helpLearn && App.helpLearn.init) { App.helpLearn.init(); }
    initRouter();
  }

  /* Deferred scripts run before DOMContentLoaded, so always wait for it. */
  if (document.readyState === 'complete') {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }
})();
