/*
  Scam Drill - Learn and Help
  All content comes from window.LEARN. Nothing here is hard-coded scam copy.
*/
(function () {
  'use strict';

  var App = window.App;
  var h = App.h;
  var icon = App.icon;
  var clear = App.clear;

  var learnStarted = false;
  var helpStarted = false;

  /* Build a text fragment with the giveaway phrase marked in yellow. */
  function withGiveaway(how, giveaway) {
    var frag = document.createDocumentFragment();
    var phrase = String(giveaway || '');
    var at = phrase ? String(how).toLowerCase().indexOf(phrase.toLowerCase()) : -1;
    if (at < 0) {
      frag.appendChild(document.createTextNode(String(how)));
      return { fragment: frag, found: false };
    }
    if (at > 0) { frag.appendChild(document.createTextNode(how.slice(0, at))); }
    var mark = h('span', { class: 'flag on' }, how.slice(at, at + phrase.length));
    frag.appendChild(mark);
    if (at + phrase.length < how.length) {
      frag.appendChild(document.createTextNode(how.slice(at + phrase.length)));
    }
    return { fragment: frag, found: true };
  }

  /* ---------------------------------------------------------------- *
   * Learn
   * ---------------------------------------------------------------- */

  function accordion(index, scam) {
    var panelId = 'scam-panel-' + index;
    var buttonId = 'scam-button-' + index;
    var open = false;

    var button = h('button', {
      class: 'acc__btn',
      type: 'button',
      id: buttonId,
      'aria-expanded': 'false',
      'aria-controls': panelId
    }, [
      h('h3', null, scam.name),
      h('span', { class: 'acc__icon' }, icon('plus', 20))
    ]);

    var how = withGiveaway(scam.how, scam.giveaway);

    var body = h('div', { class: 'acc__body' });
    var howLine = h('p');
    howLine.appendChild(how.fragment);
    body.appendChild(howLine);

    if (!how.found) {
      body.appendChild(h('p', { class: 'acc__giveaway' }, [
        'The giveaway: ',
        h('span', { class: 'flag on' }, scam.giveaway)
      ]));
    }

    body.appendChild(h('p', { class: 'acc__instead' }, [
      h('strong', null, 'Instead: '),
      scam.instead
    ]));

    var wrap = h('div', { class: 'acc', dataset: { open: 'false' } }, [
      button,
      h('div', { class: 'acc__panel', id: panelId, role: 'region', 'aria-labelledby': buttonId },
        h('div', null, body))
    ]);

    button.addEventListener('click', function () {
      open = !open;
      wrap.dataset.open = open ? 'true' : 'false';
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    return wrap;
  }

  function buildLearn() {
    var root = document.getElementById('learn-root');
    if (!root || !window.LEARN) { return false; }

    var scams = (window.LEARN.scams || []).map(function (scam, i) { return accordion(i, scam); });
    var rules = (window.LEARN.rules || []).map(function (rule) { return h('li', { class: 'rule-item' }, rule); });
    var rights = window.LEARN.rights || {};

    var rightsRows = (rights.points || []).map(function (point) {
      return h('div', { class: 'rights-item' }, [
        h('h3', null, point.title),
        h('p', null, point.text)
      ]);
    });

    root.appendChild(h('div', { class: 'page' }, [
      h('div', { class: 'page__head' }, [
        h('h1', { class: 'h1', tabindex: '-1' }, 'What scammers do')
      ]),

      h('section', { class: 'learn-section', 'aria-labelledby': 'learn-scams' }, [
        h('h2', { class: 'h2', id: 'learn-scams' }, 'Common scams'),
        h('div', null, scams)
      ]),

      h('section', { class: 'learn-section', 'aria-labelledby': 'learn-rules' }, [
        h('h2', { class: 'h2', id: 'learn-rules' }, 'Golden rules'),
        h('ol', { class: 'rules-list' }, rules)
      ]),

      h('section', { class: 'learn-section', 'aria-labelledby': 'learn-rights' }, [
        h('h2', { class: 'h2', id: 'learn-rights' }, rights.heading || 'If your money is at risk: your rights'),
        rights.intro ? h('p', { class: 'rights-intro' }, rights.intro) : null,
        h('div', { class: 'rights-list' }, rightsRows),
        rights.disclaimer ? h('p', { class: 'rights-disclaimer' }, rights.disclaimer) : null
      ])
    ]));

    return true;
  }

  /* ---------------------------------------------------------------- *
   * Help
   * ---------------------------------------------------------------- */

  function readDone() {
    var stored = App.storage.get('help', []);
    var done = {};
    if (Array.isArray(stored)) {
      stored.forEach(function (value) {
        if (typeof value === 'number') { done[value] = true; }
      });
    }
    return done;
  }

  function writeDone(done) {
    var list = Object.keys(done)
      .filter(function (key) { return done[key]; })
      .map(Number)
      .sort(function (a, b) { return a - b; });
    App.storage.set('help', list);
  }

  function buildHelp() {
    var root = document.getElementById('help-root');
    if (!root || !window.LEARN) { return false; }

    var done = readDone();
    var steps = window.LEARN.helpSteps || [];

    var progress = h('p', { class: 'help-progress', role: 'status', 'aria-live': 'polite' });

    var list = h('div', { class: 'help-list', role: 'group', 'aria-label': 'Steps to take after a fraud' });
    var rows = [];

    function paintProgress() {
      var count = steps.filter(function (step, i) { return done[i]; }).length;
      progress.textContent = count + ' of ' + steps.length + ' done';
    }

    steps.forEach(function (step, i) {
      var button = h('button', {
        class: 'step',
        type: 'button',
        role: 'checkbox',
        'aria-checked': done[i] ? 'true' : 'false'
      }, [
        h('span', { class: 'step__box', 'aria-hidden': 'true' }, icon('check', 18)),
        h('span', null, [
          h('span', { class: 'step__title' }, step.title),
          h('span', { class: 'step__detail' }, step.detail)
        ])
      ]);
      button.addEventListener('click', function () {
        var next = !done[i];
        done[i] = next;
        button.setAttribute('aria-checked', next ? 'true' : 'false');
        writeDone(done);
        paintProgress();
      });
      rows.push(button);
      list.appendChild(button);
    });

    paintProgress();

    var ready = h('ul', { class: 'ready-list' }, (window.LEARN.ready || []).map(function (item) {
      return h('li', null, item);
    }));

    var links = h('ul', { class: 'link-list' }, (window.LEARN.links || []).map(function (link) {
      return h('li', null, [
        h('a', { href: link.url, target: '_blank', rel: 'noopener noreferrer' }, [
          link.label,
          ' ',
          icon('external', 16)
        ]),
        link.note ? h('span', { class: 'link-note' }, link.note) : null
      ]);
    }));

    root.appendChild(h('div', { class: 'page' }, [
      h('h1', { class: 'h1', tabindex: '-1' }, 'It happened. Do this now.'),

      h('section', { class: 'help-top', 'aria-labelledby': 'helpline-label' }, [
        h('p', { class: 'help-top__number', id: 'helpline-label' }, '1930'),
        h('p', { class: 'label' }, 'National Cyber Crime Helpline'),
        h('p', { class: 'help-top__text' }, 'Call within the first hour. Fast reports can freeze the money before it moves on.'),
        h('a', { class: 'btn btn--primary', href: 'tel:1930' }, [
          icon('phone', 18),
          'Call 1930'
        ]),
        h('p', { class: 'help-top__link' },
          h('a', { href: 'https://cybercrime.gov.in', target: '_blank', rel: 'noopener noreferrer' }, 'cybercrime.gov.in'))
      ]),

      progress,
      list,

      h('section', { class: 'help-section', 'aria-labelledby': 'ready-title' }, [
        h('h2', { class: 'h2', id: 'ready-title' }, 'What to have ready'),
        ready
      ]),

      h('section', { class: 'help-section', 'aria-labelledby': 'report-title' }, [
        h('h2', { class: 'h2', id: 'report-title' }, 'Report fake messages'),
        links
      ])
    ]));

    return true;
  }

  function init() {
    if (!learnStarted) { learnStarted = buildLearn(); }
    if (!helpStarted) { helpStarted = buildHelp(); }
  }

  App.helpLearn = { init: init };
})();
