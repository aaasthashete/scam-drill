/*
  Scam Drill - message checker engine
  -----------------------------------
  Plain script (NOT an ES module) so index.html works from file://.
  Browser:  window.ScamChecker.analyze(text)
  Node:     const { analyze } = require('./checker-rules.js')

  analyze(text) returns:
  {
    score: 0-100,
    level: 'high' | 'medium' | 'low',
    verdict: string,         // short headline
    summary: string,         // one plain sentence
    matches: [{ id, label, severity, weight, why, spans: [{start, end}] }],  // spans index into the ORIGINAL text
    notes: [string],         // extra hints (e.g. standard OTP message)
    standardOtp: boolean
  }

  Everything runs locally. Nothing the user pastes is sent anywhere.
*/
(function (root) {
  var RULES = [
    {
      id: 'ask-secret', label: 'Asks for an OTP, PIN or card detail', weight: 35, ignoreIfNegated: true,
      re: /\b(share|send|tell|provide|enter|confirm|read out|reply with|give|forward)\b[^.\n]{0,40}\b(otp|pin|cvv|password|card number|expiry|aadhaar number)\b/gi,
      why: 'No bank, wallet or government office will ever ask you for an OTP, PIN, CVV or password.'
    },
    {
      id: 'pin-to-receive', label: 'Says you must enter a PIN or approve to receive money', weight: 40,
      re: /\b(approve|accept)\b[^.\n]{0,40}\b(request|collect|payment)\b[^.\n]{0,50}\b(receive|get|credit|refund)\b|\b(enter|type)\b[^.\n]{0,25}\bpin\b[^.\n]{0,25}\b(to receive|to get|to credit|for refund)\b/gi,
      why: 'You never enter a PIN or approve a request to receive money. A PIN always means money leaves your account.'
    },
    {
      id: 'qr-to-receive', label: 'Asks you to scan a QR code to receive money', weight: 35,
      re: /\bscan\b[^.\n]{0,40}\b(qr|code)\b[^.\n]{0,50}\b(receive|get|credit|refund|money)\b/gi,
      why: 'Scanning a QR code is always a payment going out. You never scan to receive.'
    },
    {
      id: 'remote-app', label: 'Asks you to install a remote-access app', weight: 40,
      re: /\b(anydesk|teamviewer|quick\s?support|rustdesk|airdroid|screen\s?shar(e|ing)|remote (access|support))\b/gi,
      why: 'These apps hand over full control of your phone, including your banking apps and OTPs.'
    },
    {
      id: 'safe-account', label: 'Asks you to move money to a safe or verification account', weight: 40,
      re: /\b(safe account|secure account|verification account|rbi account|escrow account)\b/gi,
      why: 'No government agency or bank has a safe account where you must move your money.'
    },
    {
      id: 'authority-threat', label: 'Uses a police, court or agency threat', weight: 30,
      re: /\b(cbi|ncb|narcotics|customs officer|cyber ?crime (branch|police)|arrest warrant|digital arrest|money laundering|illegal (items|parcel|goods)|under investigation)\b/gi,
      why: 'Scammers pose as police or agencies to scare you. Real agencies send written notices and never arrest anyone on a call.'
    },
    {
      id: 'advance-fee', label: 'Asks for a fee to release money or a prize', weight: 30,
      re: /\b(processing fee|registration fee|gst (charges|fee)|refundable (deposit|amount)|clearance (fee|charges)|claim (fee|charges))\b|\bpay\b[^.\n]{0,25}\bto (claim|receive|release|unlock)\b/gi,
      why: 'If you have to pay to receive money, it is not a prize. It is a scam.'
    },
    {
      id: 'investment-promise', label: 'Promises guaranteed or very high returns', weight: 30,
      re: /\b(guaranteed (returns?|profit)|assured (returns?|profit)|\d{2,3}\s?% (monthly|weekly|daily|returns?)|double your money|insider (tip|info)|vip (group|tips)|sure[- ]shot)\b/gi,
      why: 'No investment can guarantee returns. A guarantee is the clearest sign of fraud.'
    },
    {
      id: 'utility-threat', label: 'Threatens to cut your electricity or gas', weight: 30,
      re: /\b(electricity|power supply|power connection|gas connection|bijli)\b[^.\n]{0,70}\b(disconnect(ed|ion)?|cut|unpaid|not paid|pending)\b/gi,
      why: 'Utilities give written notice and days of warning. They do not send a same-day SMS with a mobile number.'
    },
    {
      id: 'verify-one-rupee', label: 'Asks you to send Rs 1 to verify', weight: 35,
      re: /\b(send|pay|transfer)\s+(rs\.?|inr|₹)?\s?1\b[^.\n]{0,40}\b(verify|verification|activate|confirm)\b/gi,
      why: 'A "verification payment" is a way to get your UPI details or start a bigger fraud.'
    },
    {
      id: 'fraud-claim', label: 'Claims your account is under attack', weight: 20,
      re: /\b(someone is trying to|unauthori[sz]ed (transaction|access|login)|suspicious (activity|login|transaction)|your account (has been )?(hacked|compromised))\b/gi,
      why: 'Invented emergencies make you panic. Check your account in the official app instead.'
    },
    {
      id: 'account-block', label: 'Threatens to block your account, card or SIM', weight: 20,
      re: /\b(account|card|sim|number|services?|connection|upi|wallet)\b[^.\n]{0,20}\b(will be|has been|is being|shall be)\b[^.\n]{0,15}\b(blocked|suspended|deactivated|disconnected|frozen|closed|terminated)\b/gi,
      why: 'Banks do not close accounts through a text message with a link.'
    },
    {
      id: 'kyc', label: 'Mentions a KYC, PAN or Aadhaar update', weight: 15,
      re: /\b(re-?kyc|kyc|pan (card )?(update|link|expire)|aadhaar (update|link|verification))\b/gi,
      why: 'KYC is updated in the bank\'s own app, net banking or branch, not through a link someone sends.'
    },
    {
      id: 'prize', label: 'Says you won a prize or reward', weight: 25,
      re: /\b(you (have )?won|congratulations|lucky (draw|winner)|lottery|jackpot|reward points?)\b/gi,
      why: 'You cannot win a contest you did not enter.'
    },
    {
      id: 'job-task', label: 'Offers an easy job or paid tasks', weight: 25,
      re: /\b(part[- ]?time job|work from home|earn (rs\.?|inr|₹)?\s?\d[\d,]*\s?(\/|per|a)\s?(day|hour)|daily (income|salary)|like (and )?subscribe|prepaid task|task (commission|group)|telegram (group|channel)|no experience (needed|required))\b/gi,
      why: 'Task and job scams pay small amounts first, then ask for a large deposit.'
    },
    {
      id: 'deposit-for-return', label: 'Asks for a deposit and promises it back with extra', weight: 30,
      re: /\b(deposit|pay|transfer|invest)\b[^\n]{0,20}(rs\.?|inr|₹)\s?\d[\d,]{3,}[^\n]{0,70}\b(returned|refunded|back|profit|returns)\b/gi,
      why: 'Real employers pay you. A deposit that "comes back with extra" is the oldest trick in task and investment scams.'
    },
    {
      id: 'permission-grab', label: 'Asks for access to your contacts, photos or SMS', weight: 25,
      re: /\b(allow|grant)\b[^.\n]{0,15}\b(access|permission)\b[^.\n]{0,40}\b(contacts|gallery|photos|sms|camera|location)\b/gi,
      why: 'A loan or job never needs your contacts or photos. Illegal apps use them to threaten you.'
    },
    {
      id: 'loan-bait', label: 'Offers an instant loan with no checks', weight: 20,
      re: /\b(instant loan|loan approved|pre-?approved loan|no (cibil|credit score|documents)|without (documents|cibil)|loan in \d+ ?(min|minutes))\b/gi,
      why: 'Real lenders always do KYC and a credit check. Illegal apps use your contacts to blackmail you.'
    },
    {
      id: 'short-link', label: 'Contains a shortened link', weight: 25,
      re: /\b(bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy|is\.gd|goo\.gl|shorturl\.at|ow\.ly|t\.ly)\/\S+/gi,
      why: 'Shortened links hide where they really lead.'
    },
    {
      id: 'odd-domain', label: 'Link looks like a copy of a real site', weight: 15,
      re: /\bhttps?:\/\/[^\s]*(kyc|bank|upi|refund|verify|update|reward|claim)[^\s]*(\.(xyz|top|click|cc|icu|buzz|online|site|live|vip|shop|co\.in|in\.net)|-[a-z0-9-]+\.)[^\s]*/gi,
      why: 'Look-alike domains copy a real brand with extra words or hyphens. Never type your details after tapping a link in a message.'
    },
    {
      id: 'any-link', label: 'Contains a link you are asked to open', weight: 10,
      re: /\b(https?:\/\/|www\.)\S+/gi,
      why: 'Do not open links in unexpected messages. Open the official app or website yourself.'
    },
    {
      id: 'call-number', label: 'Tells you to call a mobile number', weight: 20,
      re: /\b(call|contact|whatsapp|reach)\b[^.\n]{0,40}(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/gi,
      why: 'Banks and utilities use official helplines. They do not ask you to call a personal mobile number.'
    },
    {
      id: 'urgency', label: 'Pushes you to act in a hurry', weight: 15,
      re: /\b(immediately|urgent(ly)?|within \d+ ?(hours?|hrs?|mins?|minutes?)|tonight|last warning|final notice|right now|hurry|asap|(\d+|two|five|ten)\s+(hours?|mins?|minutes?)\s+(left|remaining)|slots? filling fast|limited time)\b/gi,
      why: 'Scammers rush you so you do not stop to think or ask someone.'
    },
    {
      id: 'generic-greeting', label: 'Uses a generic greeting', weight: 8,
      re: /^\s*(dear|respected) (customer|user|sir|madam|account holder|valued customer|consumer)\b/gi,
      why: 'Real notices use your name or the last digits of your account.'
    }
  ];

  var NEGATION = /\b(do not|don't|dont|never|not to)\s+(share|tell|give|disclose|reveal|forward|send)\b[^.\n]*/gi;

  function overlap(a, b) { return a.start < b.end && b.start < a.end; }

  function collect(re, text) {
    var out = [], m;
    var rx = new RegExp(re.source, re.flags.indexOf('g') > -1 ? re.flags : re.flags + 'g');
    while ((m = rx.exec(text)) !== null) {
      if (m[0].length === 0) { rx.lastIndex++; continue; }
      out.push({ start: m.index, end: m.index + m[0].length });
    }
    return out;
  }

  function analyze(input) {
    var text = String(input || '');
    var negated = collect(NEGATION, text);
    var matches = [];

    RULES.forEach(function (rule) {
      var spans = collect(rule.re, text).filter(function (s) {
        return !(rule.ignoreIfNegated && negated.some(function (n) { return overlap(n, s); }));
      });
      if (spans.length) {
        matches.push({
          id: rule.id, label: rule.label, weight: rule.weight, why: rule.why, spans: spans,
          severity: rule.weight >= 30 ? 'high' : (rule.weight >= 15 ? 'medium' : 'low')
        });
      }
    });

    // Shape checks that are not a single regex.
    var letters = text.replace(/[^A-Za-z]/g, '');
    var upper = text.replace(/[^A-Z]/g, '');
    if (letters.length > 30 && upper.length / letters.length > 0.4) {
      matches.push({ id: 'shouting', label: 'Written in ALL CAPS', weight: 8, severity: 'low', spans: [],
        why: 'Official messages rarely shout. Capital letters are used to create panic.' });
    }
    if (/!{2,}/.test(text)) {
      matches.push({ id: 'exclaim', label: 'Heavy use of exclamation marks', weight: 5, severity: 'low', spans: [],
        why: 'Real notices stay calm and factual.' });
    }

    var score = matches.reduce(function (sum, m) { return sum + m.weight; }, 0);
    if (matches.length >= 3) score += 10; // several different tricks together is a stronger signal
    score = Math.min(100, score);

    var notes = [];
    var standardOtp = false;
    var otpShape = /\b\d{4,8}\b[^.\n]{0,40}\botp\b|\botp\b[^.\n]{0,30}\b\d{4,8}\b/i.test(text);
    if (otpShape && negated.length > 0 && score < 30) {
      standardOtp = true;
      notes.push('This looks like a normal OTP message. It is safe only if YOU just started that action, and you must never read it out to anyone, including someone who calls afterwards.');
    }
    if (score === 0 && !standardOtp && text.trim().length > 0) {
      notes.push('No common scam patterns found. That does not prove the message is safe. If it asks for money, a code or a link click, check through the official app.');
    }

    var level, verdict, summary;
    if (score >= 60) {
      level = 'high'; verdict = 'Very likely a scam';
      summary = 'This message uses several well-known scam tricks together. Do not reply, click or pay.';
    } else if (score >= 30) {
      level = 'medium'; verdict = 'Suspicious';
      summary = 'This message has clear warning signs. Verify through the official app or helpline before doing anything.';
    } else {
      level = 'low'; verdict = standardOtp ? 'Looks like a normal OTP' : (score === 0 ? 'No scam patterns found' : 'A few warning signs');
      summary = standardOtp ? 'Use the code only where you started the action.' : 'Stay careful. Never share codes or pay on someone else\'s request.';
    }

    matches.sort(function (a, b) { return b.weight - a.weight; });
    return { score: score, level: level, verdict: verdict, summary: summary, matches: matches, notes: notes, standardOtp: standardOtp };
  }

  var api = { analyze: analyze, RULES: RULES };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.ScamChecker = api;
})(typeof window !== 'undefined' ? window : this);
