/*
  Scam Drill - scenario bank
  --------------------------
  Plain script (NOT an ES module) so index.html works when opened from file://.
  Exposes: window.SCENARIOS (array of 12).

  Shape of every scenario:
  {
    id, category, channel ('sms' | 'whatsapp' | 'call' | 'video' | 'telegram'),
    sender, title, context (one line shown above the phone),
    messages: [{ from: 'them', text, time }],
    question,
    choices: [{ id, text, verdict: 'best' | 'partial' | 'bad', points, feedback }],
    flags: [{ phrase, why, type: 'red' | 'green' }],   // phrase MUST appear verbatim inside one message text
    lesson, goldenRule
  }

  Scoring: best = 10, partial = 3 to 6, bad = 0. Exactly one 'best' per scenario.
  All bank, brand and phone details below are fictional.
*/
window.SCENARIOS = [
  {
    id: 'kyc-sms',
    category: 'KYC and account block',
    channel: 'sms',
    sender: 'VM-NVBANK',
    title: 'The account block warning',
    context: 'You have a savings account with Navbharat Bank. This SMS arrives at breakfast.',
    messages: [
      {
        from: 'them',
        text: 'Dear Customer, your Navbharat Bank account will be BLOCKED today. Complete KYC immediately: http://navbharat-kyc.co.in/update',
        time: '9:42 AM'
      }
    ],
    question: 'What do you do?',
    choices: [
      { id: 'a', text: 'Tap the link and fill in the form quickly.', verdict: 'bad', points: 0,
        feedback: 'The link opens a copy of the bank page. Everything you type, including card number and OTP, goes straight to the scammer.' },
      { id: 'b', text: 'Reply YES to confirm your number is active.', verdict: 'bad', points: 0,
        feedback: 'Replying tells the scammer your number is live, so you will get more attempts.' },
      { id: 'c', text: 'Ignore the link. Open the bank\'s official app, or visit the branch, to see if KYC is really pending.', verdict: 'best', points: 10,
        feedback: 'Correct. If KYC is genuinely pending, the official app will show it. You never need the link.' },
      { id: 'd', text: 'Delete the message and carry on without checking anything.', verdict: 'partial', points: 5,
        feedback: 'Safe, but a quick look in the official app would tell you for certain whether anything is pending.' }
    ],
    flags: [
      { phrase: 'will be BLOCKED today', why: 'Fear plus a deadline, so you act before thinking.', type: 'red' },
      { phrase: 'immediately', why: 'Urgency words are in almost every scam message.', type: 'red' },
      { phrase: 'http://navbharat-kyc.co.in/update', why: 'Not the bank\'s real website. Banks do KYC in the app, net banking or branch, not through SMS links.', type: 'red' }
    ],
    lesson: 'Banks do not block accounts over an SMS. KYC updates happen in the bank\'s app, net banking or at the branch.',
    goldenRule: 'Never act on a link in a message. Open the official app yourself.'
  },

  {
    id: 'fraud-team-call',
    category: 'OTP and card details',
    channel: 'call',
    sender: 'Unknown +91 90000 12345',
    title: 'The helpful fraud officer',
    context: 'An unknown number calls while you are at work. The caller knows your name.',
    messages: [
      { from: 'them', text: 'Hello sir, I am calling from the Navbharat Bank fraud prevention team. Someone is trying to withdraw Rs 49,000 from your account right now.', time: '0:05' },
      { from: 'them', text: 'To stop it, tell me the OTP you just received on your phone. Hurry, only two minutes left.', time: '0:21' }
    ],
    question: 'What do you do?',
    choices: [
      { id: 'a', text: 'Read out the OTP to stop the withdrawal.', verdict: 'bad', points: 0,
        feedback: 'That OTP is the key to approve a payment. You just authorised the theft yourself.' },
      { id: 'b', text: 'Ask for his employee ID, and read the OTP if he sounds convincing.', verdict: 'bad', points: 0,
        feedback: 'Employee IDs are easy to invent. No real bank employee needs your OTP, ever.' },
      { id: 'c', text: 'Hang up. Call the number printed on the back of your card to check.', verdict: 'best', points: 10,
        feedback: 'Correct. Always call back on a number you trust, never on one the caller gives you.' },
      { id: 'd', text: 'Hang up and do nothing else.', verdict: 'partial', points: 5,
        feedback: 'Hanging up is right. If you are worried about your money, also check the account in the official app.' }
    ],
    flags: [
      { phrase: 'withdraw Rs 49,000 from your account right now', why: 'Invented emergency to make you panic.', type: 'red' },
      { phrase: 'tell me the OTP you just received', why: 'A real bank never asks for your OTP. It can block a card without it.', type: 'red' },
      { phrase: 'only two minutes left', why: 'A fake countdown takes away your time to think.', type: 'red' }
    ],
    lesson: 'Real fraud teams can freeze your card without any code from you. Anyone asking for an OTP is the fraud.',
    goldenRule: 'Never share an OTP, PIN or CVV with anyone, for any reason.'
  },

  {
    id: 'upi-collect',
    category: 'UPI and QR',
    channel: 'whatsapp',
    sender: 'Rohit (marketplace buyer)',
    title: 'The buyer who pays full price',
    context: 'You listed your old cycle for Rs 4,500. A buyer messages within minutes.',
    messages: [
      { from: 'them', text: 'Hi, interested in the cycle. I will pay full price now, no bargaining.', time: '4:10 PM' },
      { from: 'them', text: 'Sending a payment request of Rs 4,500. Just approve it and enter your UPI PIN to receive the money.', time: '4:11 PM' }
    ],
    question: 'A request appears in your UPI app. What do you do?',
    choices: [
      { id: 'a', text: 'Approve it and enter the PIN so you get paid.', verdict: 'bad', points: 0,
        feedback: 'An approved request sends money out of your account. A PIN is only ever needed to pay, never to receive.' },
      { id: 'b', text: 'Approve it, but type a smaller amount to be safe.', verdict: 'bad', points: 0,
        feedback: 'Any approved collect request takes money out of your account. Reducing the amount only reduces your loss.' },
      { id: 'c', text: 'Decline the request. Tell him receiving money never needs a PIN and share your UPI ID instead.', verdict: 'best', points: 10,
        feedback: 'Correct. Share your UPI ID or your own QR, and check the credit in your bank app before handing over the item.' },
      { id: 'd', text: 'Decline and block him without saying anything.', verdict: 'partial', points: 5,
        feedback: 'Safe. Explaining first can also stop him from trying the same trick on the next seller.' }
    ],
    flags: [
      { phrase: 'I will pay full price now, no bargaining', why: 'Too eager. Scam buyers skip the usual haggling.', type: 'red' },
      { phrase: 'approve it and enter your UPI PIN to receive the money', why: 'You never enter a PIN to receive money. A PIN means money is leaving.', type: 'red' }
    ],
    lesson: 'A UPI collect request is a request for YOU to pay. Entering a PIN always means money goes out.',
    goldenRule: 'To receive money you do nothing. To send money you enter a PIN.'
  },

  {
    id: 'qr-receive',
    category: 'UPI and QR',
    channel: 'whatsapp',
    sender: 'Meera (sofa buyer)',
    title: 'Scan to receive',
    context: 'You are selling a sofa. The buyer says she cannot type on her phone.',
    messages: [
      { from: 'them', text: 'I cannot type amounts on my phone, sending you a QR instead.', time: '6:30 PM' },
      { from: 'them', text: 'Scan this QR in your UPI app to receive Rs 12,000.', time: '6:30 PM' }
    ],
    question: 'What do you do?',
    choices: [
      { id: 'a', text: 'Scan it. It is just a QR.', verdict: 'bad', points: 0,
        feedback: 'A QR you scan is a payment going out. It opens a pay screen with her account as the receiver.' },
      { id: 'b', text: 'Accept a screenshot of her payment as proof and hand over the sofa.', verdict: 'bad', points: 0,
        feedback: 'Screenshots are trivial to fake. Only a credit in your own bank app or SMS counts.' },
      { id: 'c', text: 'Scan it but stop before entering the PIN.', verdict: 'partial', points: 5,
        feedback: 'Stopping before the PIN saves you, but there was never a reason to scan. Scanning is for paying.' },
      { id: 'd', text: 'Do not scan. Explain that scanning pays money out, and share your own QR for her to scan.', verdict: 'best', points: 10,
        feedback: 'Correct. The buyer scans YOUR QR. You wait for the credit alert and then hand over the item.' }
    ],
    flags: [
      { phrase: 'I cannot type amounts on my phone', why: 'A made-up reason to make you do the work.', type: 'red' },
      { phrase: 'Scan this QR in your UPI app to receive Rs 12,000', why: 'You never scan to receive. Scanning is always paying.', type: 'red' }
    ],
    lesson: 'A QR code on someone else\'s phone is almost always set up for you to pay them.',
    goldenRule: 'Scan only to pay. If someone asks you to scan to receive, it is a scam.'
  },

  {
    id: 'task-job',
    category: 'Job and investment',
    channel: 'whatsapp',
    sender: '+91 80000 55512 (HR Priya)',
    title: 'The easy part-time job',
    context: 'A stranger messages you about a work-from-home job.',
    messages: [
      { from: 'them', text: 'Hi! Part-time job: like YouTube videos and earn Rs 3,000 per day from home. No experience needed.', time: 'Mon 11:02 AM' },
      { from: 'them', text: 'Join our Telegram group to start. First 3 tasks are free.', time: 'Mon 11:03 AM' },
      { from: 'them', text: 'Congrats, you earned Rs 850! For your next prepaid task, deposit Rs 10,000. It will be returned with Rs 14,000 today.', time: 'Tue 3:20 PM' }
    ],
    question: 'They already paid you Rs 850. Now they ask for Rs 10,000. What do you do?',
    choices: [
      { id: 'a', text: 'Deposit Rs 10,000. They already paid me, so they seem real.', verdict: 'bad', points: 0,
        feedback: 'The small payout is bait to build trust. The big deposit is the real scam and it never comes back.' },
      { id: 'b', text: 'Deposit Rs 2,000 first, just to test them.', verdict: 'bad', points: 0,
        feedback: 'They will keep asking for more and show fake profits. Any deposit is lost.' },
      { id: 'c', text: 'Ask them for company registration documents.', verdict: 'partial', points: 3,
        feedback: 'Good instinct, but scammers send fake documents. A real job never needs your deposit in the first place.' },
      { id: 'd', text: 'Stop. Block the number and report it. Real jobs never charge deposits.', verdict: 'best', points: 10,
        feedback: 'Correct. Report on cybercrime.gov.in or call 1930 so others are not trapped.' }
    ],
    flags: [
      { phrase: 'earn Rs 3,000 per day from home', why: 'High pay for a trivial task is the hook.', type: 'red' },
      { phrase: 'No experience needed', why: 'Real jobs rarely pay this well for no skills.', type: 'red' },
      { phrase: 'Join our Telegram group', why: 'Moves you off a platform where you can report them.', type: 'red' },
      { phrase: 'deposit Rs 10,000', why: 'Real employers pay you. They never ask you to pay in.', type: 'red' },
      { phrase: 'returned with Rs 14,000 today', why: 'Guaranteed quick profit means the money is bait.', type: 'red' }
    ],
    lesson: 'Task scams pay small amounts first to earn your trust, then ask for a large deposit.',
    goldenRule: 'If a job makes you pay before you earn, it is a scam.'
  },

  {
    id: 'digital-arrest',
    category: 'Fear and authority',
    channel: 'video',
    sender: '"Officer Rathore" (CBI)',
    title: 'The digital arrest',
    context: 'An unknown video call. The caller is in uniform in front of an official-looking background.',
    messages: [
      { from: 'them', text: 'This is the CBI Cyber Crime Branch. A parcel in your name contains illegal items.', time: '0:10' },
      { from: 'them', text: 'You are under digital arrest. Stay on this video call and do not tell anyone.', time: '0:35' },
      { from: 'them', text: 'To prove your innocence, transfer Rs 2,00,000 to a safe account for RBI verification.', time: '1:02' }
    ],
    question: 'Your hands are shaking. What do you do?',
    choices: [
      { id: 'a', text: 'Stay on the call and transfer the money to clear your name.', verdict: 'bad', points: 0,
        feedback: 'There is no such thing as a digital arrest. No agency collects money into a safe account.' },
      { id: 'b', text: 'Ask for his ID card photo before deciding.', verdict: 'bad', points: 0,
        feedback: 'Fake ID cards are easy to show on camera. Staying on the call keeps you under their control.' },
      { id: 'c', text: 'Tell a family member but stay on the call as instructed.', verdict: 'partial', points: 4,
        feedback: 'Telling family is the right instinct. But the call is the trap. Disconnect it first.' },
      { id: 'd', text: 'Disconnect. No agency arrests people over video or asks for money. Call 1930 and report.', verdict: 'best', points: 10,
        feedback: 'Correct. Talk to someone you trust and report it to 1930. Real agencies send written notices.' }
    ],
    flags: [
      { phrase: 'parcel in your name contains illegal items', why: 'Invented crime to frighten you.', type: 'red' },
      { phrase: 'under digital arrest', why: 'There is no such legal process in India.', type: 'red' },
      { phrase: 'do not tell anyone', why: 'Isolation is the scammer\'s main weapon.', type: 'red' },
      { phrase: 'transfer Rs 2,00,000 to a safe account', why: 'No government agency uses a safe account to verify you.', type: 'red' }
    ],
    lesson: 'Fear plus secrecy plus a payment demand is the whole pattern. Real investigations never happen over a video call.',
    goldenRule: 'Hang up and tell someone you trust. Nobody official demands secrecy or money.'
  },

  {
    id: 'refund-remote',
    category: 'Refund and remote access',
    channel: 'whatsapp',
    sender: 'QuickBite Support',
    title: 'The failed refund',
    context: 'You cancelled a food order earlier today, so a refund message does not feel odd.',
    messages: [
      { from: 'them', text: 'Your QuickBite refund of Rs 349 has failed. Our agent will help you.', time: '2:15 PM' },
      { from: 'them', text: 'Please install the QuickSupport app from the link and share the 9-digit code shown on your screen.', time: '2:16 PM' }
    ],
    question: 'It is only Rs 349. What do you do?',
    choices: [
      { id: 'a', text: 'Install the app and share the code.', verdict: 'bad', points: 0,
        feedback: 'That code gives them full control of your phone, including your banking apps and OTPs. The loss is far more than Rs 349.' },
      { id: 'b', text: 'Share only your card number, not the code.', verdict: 'bad', points: 0,
        feedback: 'Card details are exactly what they want. Never share them to receive a refund.' },
      { id: 'c', text: 'Search the company\'s customer care number on Google and call it.', verdict: 'partial', points: 3,
        feedback: 'Better, but numbers in search results and ads are often fake. Use the number inside the company\'s own app.' },
      { id: 'd', text: 'Ignore this. Check the refund status inside the QuickBite app.', verdict: 'best', points: 10,
        feedback: 'Correct. Refunds go back to your original payment method on their own. You do not need an agent.' }
    ],
    flags: [
      { phrase: 'install the QuickSupport app', why: 'Remote-access apps let a stranger see and control your screen.', type: 'red' },
      { phrase: 'share the 9-digit code shown on your screen', why: 'That code is the key that hands over your phone.', type: 'red' },
      { phrase: 'refund of Rs 349 has failed', why: 'A small amount lowers your guard.', type: 'red' }
    ],
    lesson: 'A refund never needs an app, a code, a PIN or a card number. It goes back to where you paid from.',
    goldenRule: 'Never install a screen-sharing or remote support app because a stranger asks you to.'
  },

  {
    id: 'lucky-draw',
    category: 'Prize and loan',
    channel: 'sms',
    sender: 'LD-DRAWTM',
    title: 'You won Rs 25 lakh',
    context: 'You do not remember entering any contest.',
    messages: [
      {
        from: 'them',
        text: 'CONGRATULATIONS! You have won Rs 25,00,000 in the Mega Diwali Lucky Draw. Pay Rs 4,500 GST charges to claim your prize today.',
        time: '11:55 AM'
      }
    ],
    question: 'What do you do?',
    choices: [
      { id: 'a', text: 'Pay the Rs 4,500. It is a tiny price for Rs 25 lakh.', verdict: 'bad', points: 0,
        feedback: 'There is no prize. After the first fee they will invent more fees until you stop paying.' },
      { id: 'b', text: 'Forward it to friends so they can enter too.', verdict: 'bad', points: 0,
        feedback: 'You would be spreading the scam. Report it and delete it instead.' },
      { id: 'c', text: 'Ask them to deduct the fee from the prize amount.', verdict: 'partial', points: 4,
        feedback: 'A clever test, but any reply keeps you in their system. No prize exists to deduct from.' },
      { id: 'd', text: 'Ignore, block and report it. You cannot win a draw you never entered.', verdict: 'best', points: 10,
        feedback: 'Correct. Genuine prizes never ask for fees before you receive them.' }
    ],
    flags: [
      { phrase: 'CONGRATULATIONS!', why: 'Excitement is the bait.', type: 'red' },
      { phrase: 'You have won Rs 25,00,000', why: 'Huge unexpected prize for a contest you never entered.', type: 'red' },
      { phrase: 'Pay Rs 4,500 GST charges', why: 'Real winners never pay fees to receive a prize.', type: 'red' },
      { phrase: 'claim your prize today', why: 'A deadline so you do not stop to think.', type: 'red' }
    ],
    lesson: 'If you have to pay to receive money, it is not a prize. It is a scam.',
    goldenRule: 'You cannot win a contest you did not enter, and you never pay to collect a prize.'
  },

  {
    id: 'loan-app',
    category: 'Prize and loan',
    channel: 'whatsapp',
    sender: 'LoanZap Offers',
    title: 'Loan in five minutes',
    context: 'Your rent is due and money is tight. This message arrives at the right moment.',
    messages: [
      { from: 'them', text: 'Instant loan up to Rs 50,000 in 5 minutes. No CIBIL check, no documents. Download LoanZap now.', time: '8:20 PM' },
      { from: 'them', text: 'Allow access to Contacts, Gallery and SMS to get approved.', time: '8:21 PM' }
    ],
    question: 'You need money badly. What do you do?',
    choices: [
      { id: 'a', text: 'Install the app and allow all permissions.', verdict: 'bad', points: 0,
        feedback: 'Fake loan apps copy your contacts and photos, then threaten and shame you in front of them.' },
      { id: 'b', text: 'Ask a friend to try it first.', verdict: 'bad', points: 0,
        feedback: 'You would be putting your friend at risk. The app itself is the problem.' },
      { id: 'c', text: 'Install it but deny the contacts permission.', verdict: 'partial', points: 4,
        feedback: 'Better, but these apps often refuse to work without it, or find other ways in.' },
      { id: 'd', text: 'Borrow only from a bank or an RBI-regulated lender. Verify the lender on RBI\'s website first.', verdict: 'best', points: 10,
        feedback: 'Correct. Regulated lenders do KYC and a credit check. Be wary of anyone who skips both.' }
    ],
    flags: [
      { phrase: 'No CIBIL check, no documents', why: 'Real lenders always check credit and KYC.', type: 'red' },
      { phrase: 'Allow access to Contacts, Gallery and SMS', why: 'A loan never needs your contacts or photos. They are used for blackmail.', type: 'red' },
      { phrase: 'in 5 minutes', why: 'Speed is used to rush you past the checks.', type: 'red' }
    ],
    lesson: 'Illegal loan apps lend small amounts at huge interest and then harass borrowers using their contact list.',
    goldenRule: 'Borrow only from lenders you can verify as regulated.'
  },

  {
    id: 'stock-tips',
    category: 'Job and investment',
    channel: 'telegram',
    sender: 'Stock King VIP',
    title: 'Guaranteed 30% a month',
    context: 'You recently started learning about the stock market, and a stranger adds you to a group.',
    messages: [
      { from: 'them', text: 'Join our VIP group. 30% guaranteed monthly returns. SEBI registered analyst, 500+ members profiting daily.', time: '10:05 AM' },
      { from: 'them', text: 'Deposit Rs 5,000 in our trading app to start. Slots filling fast.', time: '10:06 AM' }
    ],
    question: 'What do you do?',
    choices: [
      { id: 'a', text: 'Deposit Rs 5,000. It is a small amount to try.', verdict: 'bad', points: 0,
        feedback: 'Their trading app shows fake profits to make you invest more. Withdrawals will then be blocked.' },
      { id: 'b', text: 'Join the group but do not deposit anything.', verdict: 'partial', points: 5,
        feedback: 'You are safe from loss, but the group will push you with fake profit screenshots and pressure.' },
      { id: 'c', text: 'Walk away. No one can guarantee returns. Check any adviser on SEBI\'s official website.', verdict: 'best', points: 10,
        feedback: 'Correct. Real markets go up and down, so any guarantee is false. Trade only through registered brokers.' },
      { id: 'd', text: 'Ask them to show their SEBI registration number.', verdict: 'bad', points: 0,
        feedback: 'Scammers quote real registration numbers that belong to someone else. You must check it yourself on SEBI\'s site.' }
    ],
    flags: [
      { phrase: '30% guaranteed monthly returns', why: 'No investment can guarantee returns. Markets are never certain.', type: 'red' },
      { phrase: 'SEBI registered analyst', why: 'A claim you must verify yourself on SEBI\'s website.', type: 'red' },
      { phrase: 'Deposit Rs 5,000 in our trading app', why: 'A private app that is not a registered broker.', type: 'red' },
      { phrase: 'Slots filling fast', why: 'Fake scarcity to rush you.', type: 'red' }
    ],
    lesson: 'Higher returns always mean higher risk. A guarantee is the clearest sign of a fraud.',
    goldenRule: 'Verify advisers and brokers on SEBI\'s website before you invest a rupee.'
  },

  {
    id: 'electricity-sms',
    category: 'Utility bills',
    channel: 'sms',
    sender: 'JD-ELCBRD',
    title: 'Power cut tonight',
    context: 'You paid your electricity bill last week, but you are not 100% sure.',
    messages: [
      {
        from: 'them',
        text: 'Dear Consumer, your electricity connection will be disconnected tonight at 9:30 PM as last month\'s bill is unpaid. Contact officer immediately: 90000 67890.',
        time: '5:48 PM'
      }
    ],
    question: 'What do you do?',
    choices: [
      { id: 'a', text: 'Call the officer and follow his instructions.', verdict: 'bad', points: 0,
        feedback: 'He will ask you to install a screen-sharing app or pay on a link. Do not engage.' },
      { id: 'b', text: 'Call, but only to ask for details. Do not pay.', verdict: 'bad', points: 0,
        feedback: 'Staying on the line gives them time to pressure you. Do not call back at all.' },
      { id: 'c', text: 'Check your last paid bill. If it is paid, ignore the message.', verdict: 'partial', points: 6,
        feedback: 'Good reasoning. Confirm on the board\'s official app or website too.' },
      { id: 'd', text: 'Ignore the number. Check the bill on the electricity board\'s official app or the number printed on your bill.', verdict: 'best', points: 10,
        feedback: 'Correct. Utilities send written notices and give days of warning. They never ask you to call a mobile number.' }
    ],
    flags: [
      { phrase: 'will be disconnected tonight at 9:30 PM', why: 'A same-day deadline. Real utilities give notice.', type: 'red' },
      { phrase: 'Contact officer immediately: 90000 67890', why: 'A personal mobile number. Real boards use official helplines.', type: 'red' },
      { phrase: 'Dear Consumer', why: 'Generic greeting. A real notice has your name and consumer number.', type: 'red' }
    ],
    lesson: 'Electricity disconnection scams are common. Real notices come on paper, with days of warning.',
    goldenRule: 'Never call a mobile number from a bill threat. Use the number printed on your own bill.'
  },

  {
    id: 'genuine-otp',
    category: 'A genuine message',
    channel: 'sms',
    sender: 'AX-NVBANK',
    title: 'Is this one a scam?',
    context: 'You are checking out on the ShopKart app right now and have just tapped Pay.',
    messages: [
      {
        from: 'them',
        text: '482913 is your OTP for Rs 1,299 payment to ShopKart. Do not share it with anyone. Valid for 10 minutes. -Navbharat Bank',
        time: '1:12 PM'
      }
    ],
    question: 'Not everything is a scam. What do you do?',
    choices: [
      { id: 'a', text: 'Enter the OTP on the ShopKart payment screen you opened. Tell it to nobody.', verdict: 'best', points: 10,
        feedback: 'Correct. This is genuine: you started the payment, the amount and shop match, and it says not to share.' },
      { id: 'b', text: 'Block the card and call 1930. OTPs are dangerous.', verdict: 'partial', points: 4,
        feedback: 'Caution is good, but this is a normal OTP for something you just did. Know when an OTP is yours.' },
      { id: 'c', text: 'Forward it to a friend to double-check.', verdict: 'bad', points: 0,
        feedback: 'Never share an OTP, even with a friend. Anyone who has it can use it.' },
      { id: 'd', text: 'Read it out later when someone calls saying they are the ShopKart delivery agent.', verdict: 'bad', points: 0,
        feedback: 'This is the real scam: a call after a genuine OTP. Delivery agents never need it.' }
    ],
    flags: [
      { phrase: 'payment to ShopKart', why: 'Matches the payment you started yourself.', type: 'green' },
      { phrase: 'Do not share it with anyone', why: 'Genuine banks always warn you not to share.', type: 'green' },
      { phrase: 'Valid for 10 minutes', why: 'A standard expiry, with no pressure to act.', type: 'green' }
    ],
    lesson: 'A genuine OTP is one you triggered yourself. The danger is the follow-up call asking you to read it out.',
    goldenRule: 'Use an OTP only on the screen where you started the action. Never say it out loud.'
  }
];
