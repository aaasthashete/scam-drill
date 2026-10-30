/*
  Scam Drill - content for the Learn and Help screens
  Plain script (NOT an ES module). Exposes window.LEARN.
  Keep rule numbers vague where RBI may change them, and always link to the source.
*/
window.LEARN = {
  scams: [
    {
      name: 'Fake KYC and account-block links',
      how: 'An SMS says your account, card or SIM will be blocked unless you update KYC. The link opens a copy of a bank page and collects your login, card number and OTP.',
      giveaway: 'will be BLOCKED today',
      instead: 'Open your bank\'s app or visit the branch. KYC is never completed through a link in a message.'
    },
    {
      name: 'Fake bank officer calls',
      how: 'A caller says he is from the bank\'s fraud team and that someone is withdrawing your money. He asks for the OTP "to stop it".',
      giveaway: 'tell me the OTP you just received',
      instead: 'Hang up and call the number on the back of your card. Banks never ask for an OTP.'
    },
    {
      name: 'UPI collect requests and QR codes',
      how: 'A "buyer" asks you to approve a request or scan a QR to receive money. Both actions send money from you to the scammer.',
      giveaway: 'enter your UPI PIN to receive the money',
      instead: 'Share your own UPI ID or QR. Wait for the credit alert in your bank app before handing over anything.'
    },
    {
      name: 'Task jobs and investment groups',
      how: 'You are paid a small amount for easy tasks or "tips", then asked to deposit a larger amount that is promised back with profit. It never comes back.',
      giveaway: 'returned with Rs 14,000 today',
      instead: 'Never pay to earn. Check advisers and brokers on SEBI\'s website. No one can guarantee returns.'
    },
    {
      name: 'Digital arrest',
      how: 'Callers in uniform on a video call say you are linked to a crime and must stay on the call and move money to a "safe account" to prove your innocence.',
      giveaway: 'under digital arrest',
      instead: 'Disconnect and tell someone you trust. Digital arrest does not exist. Report to 1930.'
    },
    {
      name: 'Fake refunds and remote-access apps',
      how: 'A stranger says a refund failed and asks you to install a screen-sharing app and read out a code. They then control your phone and bank apps.',
      giveaway: 'share the 9-digit code shown on your screen',
      instead: 'Check refunds inside the company\'s own app. Never install an app because a caller asked.'
    },
    {
      name: 'Prizes, lotteries and advance fees',
      how: 'A message says you have won a large prize. You must first pay a "tax", "GST" or "processing fee". More fees follow until you stop paying.',
      giveaway: 'Pay Rs 4,500 GST charges',
      instead: 'You cannot win a draw you never entered. Genuine prizes never need an upfront payment.'
    },
    {
      name: 'Instant loan apps',
      how: 'An app offers a loan with no checks, then reads your contacts and photos. If you miss a payment, it sends threats and shaming messages to your contacts.',
      giveaway: 'Allow access to Contacts, Gallery and SMS',
      instead: 'Borrow only from a bank or a lender that is regulated by RBI. Never give an app your contacts or gallery.'
    }
  ],

  rules: [
    'Never share an OTP, PIN or CVV. Not with the bank, not with anyone.',
    'A PIN means money goes out. You never need one to receive.',
    'Scan only to pay. Never scan to receive.',
    'Do not tap links in messages. Open the official app yourself.',
    'Hang up and call back on a number you trust.',
    'Urgency, fear or secrecy is the scam. Stop and tell someone.'
  ],

  rights: {
    heading: 'If your money is at risk: your rights',
    intro: 'RBI has a framework that limits what a customer loses in an unauthorised electronic transaction. The core idea is simple: report fast, and keep proof that you did.',
    points: [
      { title: 'Report within 3 working days', text: 'If the fraud is due to a fault in the bank or the system, or a breach elsewhere where you did nothing wrong, your liability is zero when you report within 3 working days of the bank\'s alert.' },
      { title: 'Reporting in 4 to 7 working days', text: 'Your liability is limited, and the cap depends on the type of account. After 7 working days, the bank\'s own board-approved policy decides.' },
      { title: 'If you shared the OTP or PIN', text: 'This is usually treated as customer negligence. You may bear the loss until you report it. Report at once, because the bank carries more of the loss after your report.' },
      { title: 'The bank has a deadline too', text: 'When you report a covered unauthorised transaction, the bank must credit the amount back (a "shadow reversal") within a set number of working days.' },
      { title: 'This area is changing', text: 'RBI announced a new compensation framework for small-value digital fraud in 2026. Limits and conditions can change, so check the latest RBI circular for the current amounts.' }
    ],
    disclaimer: 'Educational summary, not legal advice. Check the current rules on rbi.org.in or with your bank.'
  },

  helpSteps: [
    { title: 'Call 1930 now', detail: 'Tell them the time of the incident, the amount, and the account or UPI ID the money went to. Fast reports can freeze the money.' },
    { title: 'Call your bank\'s official helpline', detail: 'Use the number on your card or in the official app. Ask them to block the card or UPI and mark the transaction as fraud.' },
    { title: 'File a report on cybercrime.gov.in', detail: 'Add screenshots, transaction IDs (UTR), the scammer\'s phone number, UPI ID or website.' },
    { title: 'Secure your phone and accounts', detail: 'If you installed a remote-access app, uninstall it and switch on flight mode. From another device, change your banking passwords and UPI PIN.' },
    { title: 'Write to your bank and keep the receipt', detail: 'Send an email or a branch letter and keep the acknowledgement. The date you report matters for your liability.' },
    { title: 'Escalate if the bank does not act', detail: 'If the bank does not resolve your complaint within 30 days, you can complain to the RBI Ombudsman at cms.rbi.org.in.' }
  ],

  ready: [
    'Transaction IDs (UTR) and the time of each payment',
    'The scammer\'s phone number, UPI ID, website or app name',
    'Screenshots of chats, SMS and call logs',
    'Your bank statement showing the debit'
  ],

  links: [
    { label: 'National Cyber Crime Reporting Portal', url: 'https://cybercrime.gov.in', note: 'Report any online financial fraud' },
    { label: 'Sanchar Saathi (report fraud calls and messages)', url: 'https://sancharsaathi.gov.in', note: 'Government portal for suspicious calls, SMS and SIMs' },
    { label: 'RBI Complaint Management System', url: 'https://cms.rbi.org.in', note: 'Escalate a complaint about a bank' },
    { label: 'Reserve Bank of India', url: 'https://www.rbi.org.in', note: 'Current customer-protection rules and circulars' },
    { label: 'SEBI', url: 'https://www.sebi.gov.in', note: 'Check whether an adviser or broker is registered' }
  ]
};
