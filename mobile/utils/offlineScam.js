// OFFLINE SCAM CHECK. A safety net for when the server cannot be reached.
// It mirrors the scam rules in backend/rules.py (scam_flags). Keep the two in step.
// It only finds red flags. It never reads amounts or guesses a transaction.
// English and Roman Urdu keywords (plus a few Urdu-script words).

const re = (source) => new RegExp(source, 'i');

// ---- links
// Any host.ending counts. A bare one (no http or www) needs its ending all small or all capital letters,
// so that two sentences typed without a space ("received.Thank you") are not a link.
const URL_RE = new RegExp(
  String.raw`[Hh][Tt][Tt][Pp][Ss]?:\/\/[^\s]+|[Ww]{3}\.[^\s]+|(?<![@\w.\-])(?:[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?\.)+(?:[a-z]{2,24}|[A-Z]{2,24})(?![A-Za-z0-9\-])(?:\/[^\s]*)?`,
  'g'
);
const OFFICIAL_DOMAINS = [
  'jazzcash.com.pk', 'jazz.com.pk', 'easypaisa.com.pk', 'telenor.com.pk', 'zong.com.pk', 'ufone.com',
  'hbl.com', 'meezanbank.com', 'ubl.com.pk', 'ubldigital.com', 'mcb.com.pk', 'abl.com', 'bankalfalah.com',
  'askaribank.com.pk', 'faysalbank.com', 'bop.com.pk', 'sbp.org.pk', 'pta.gov.pk', 'bisp.gov.pk',
  'tcsexpress.com', 'leopardscourier.com', 'postex.pk', 'pakpost.gov.pk', 'daraz.pk', 'careem.com',
  'k-electric.com', 'ke.com.pk', 'ptcl.com.pk', 'nadra.gov.pk', 'sngpl.com.pk', 'ssgc.com.pk',
  'lesco.gov.pk', 'iesco.com.pk', 'fesco.com.pk', 'mepco.com.pk', 'gepco.com.pk', 'pesco.gov.pk',
  'wapda.gov.pk', 'foodpanda.pk', 'bankislami.com.pk', 'nayatel.com', 'stormfiber.com',
  'nbp.com.pk', 'bankalhabib.com', 'sc.com', 'jsbl.com',
];
const RISKY_ENDINGS = ['xyz', 'top', 'cfd', 'click', 'icu', 'vip', 'club', 'site', 'online', 'live', 'tk', 'ml',
  'cc', 'ly', 'gl', 'link', 'biz', 'info', 'shop'];
const SHORTENERS = ['bit.ly', 'tinyurl.com', 'cutt.ly', 't.co', 'goo.gl', 'rb.gy', 'is.gd', 'shorturl.at', 'ow.ly'];
const BRAND_WORDS = ['jazz', 'easypaisa', 'hbl', 'meezan', 'ubl', 'bisp', 'benazir', 'ehsaas', 'nadra', 'tcs', 'leopards',
  'daraz', 'bank', 'alfalah', 'askari', 'faysal', 'nbp', 'sbp', 'pta', 'ptcl', 'secure', 'verify'];
// Whole words: "confirmed" is not "confirm"
const ACTION_WORDS = re(String.raw`\b(verify|verification|login|log in|click|claim|unlock|update|confirm|kyc|secure|apply|register|reactivate|reactivation|limited|suspend|suspended|block|blocked|expire|expired)\b`);

function findLinks(text) {
  return (text.match(URL_RE) || []).map((l) => l.replace(/[.,;)]+$/, ''));
}

function hostOf(link) {
  return link.replace(/^[a-z]+:\/\//i, '').split(/[/?#:]/)[0].toLowerCase();
}

const isOfficial = (host) => OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
const isCheap = (host) => SHORTENERS.includes(host) || RISKY_ENDINGS.includes(host.split('.').pop());

// An unofficial website whose name copies a bank or brand. Short names (ubl, tcs, pta ...) must be a
// whole part of the name, so that "publisher.com" is not taken for UBL.
function isLookalike(host) {
  const parts = host.split(/[.-]/);
  return BRAND_WORDS.some((w) => parts.includes(w) || (w.length >= 4 && parts.some((p) => p.includes(w))));
}

function suspiciousLinks(text) {
  const contextRisky = ACTION_WORDS.test(text);
  return findLinks(text).filter((link) => {
    const host = hostOf(link);
    if (isOfficial(host)) return false;
    return isCheap(host) || isLookalike(host) || contextRisky;
  });
}

// ---- asks for an OTP, PIN, CNIC, password or code (a warning like "do not share your OTP" does not count)
const NEG = re(String.raw`(?<![\w'])(do not|don't|dont|never|na|nahi|nahin|mat|not)(?![\w'])|(?:^|\s)(نہ|مت|نہیں)(?=\s|$)`);
const NEVER_ASK = re(String.raw`\b(never|not|n't)\s+(?:\w+\s+)?ask`);
// "enter", "type", "confirm" and "verify" are not here: apps ask you to type a code into the app itself
const VERB = String.raw`(?:share|send|give|provide|reply|tell|submit|text|sms|whatsapp|forward|bhej\w*|bata\w*|likh\w*|dein|do)`;
const SECRET = String.raw`(?:otp|pin|cnic|password|passcode|cvv|verification code|security code|(?:\d-?digit )?code|identity card|id card|account number|شناختی کارڈ|پن|پاس ورڈ)`;
const REQ_A = new RegExp(String.raw`(?<![A-Za-z])(${VERB})(?![A-Za-z])[^.\n]{0,45}?(?<![A-Za-z])(${SECRET})(?![A-Za-z])`, 'gi');
const REQ_B = new RegExp(String.raw`(?<![A-Za-z])(${SECRET})(?![A-Za-z])[^.\n]{0,40}?(?<![A-Za-z])(${VERB})(?![A-Za-z])`, 'gi');
const CLAUSE_BREAK = ['.', '!', '?', ',', ';', '\n', '،', '۔', '؟'];

// A "not" only counts in the same part of the sentence: within 3 words before the verb, or the word right after it
function isWarning(text, verbStart, verbEnd) {
  const clauseStart = Math.max(...CLAUSE_BREAK.map((c) => text.lastIndexOf(c, verbStart - 1))) + 1;
  const before = text.slice(clauseStart, verbStart);
  const wordsBefore = before.split(/\s+/).filter(Boolean).slice(-3).join(' ');
  const wordAfter = text.slice(verbEnd).split(/[.!?,;\n،۔؟]/)[0].split(/\s+/).filter(Boolean)[0] || '';
  return NEG.test(`${wordsBefore} | ${wordAfter}`) || NEVER_ASK.test(before);
}

function asksForSecret(text) {
  for (const [pattern, verbGroup] of [[REQ_A, 1], [REQ_B, 2]]) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      pattern.lastIndex = m.index + 1; // look again from the next letter, so one warning cannot hide a request
      const verb = m[verbGroup];
      const start = verbGroup === 1 ? m.index : m.index + m[0].length - verb.length;
      if (isWarning(text, start, start + verb.length)) continue;
      if (['sms', 'text', 'whatsapp'].includes(verb.toLowerCase())
        && /\b(by|via|through|over|on|in)\s+$/i.test(text.slice(Math.max(0, start - 8), start))) continue;
      return true;
    }
  }
  return false;
}

// ---- asks to pay a fee first
const FEE_WORD = String.raw`(?:fee|fees|charges?|tax|processing|registration|security|deposit|customs|advance|inaam tax)`;
const PAY_VERB = String.raw`(?:pay|send|deposit|transfer|jama|bhej\w*|ada|karein|karen|karwayein|kijiye|dein)`;
const AMT = String.raw`(?:rs\.?\s?\d[\d,]*|\d[\d,]*\s*(?:rupay|rupees|rs))`;
const FEE_PATTERNS = [
  re(String.raw`(?<![A-Za-z])${PAY_VERB}(?![A-Za-z])[^.\n]{0,50}?(?<![A-Za-z])${FEE_WORD}(?![A-Za-z])`),
  re(String.raw`(?<![A-Za-z])${FEE_WORD}(?![A-Za-z])[^.\n]{0,60}?(?<![A-Za-z])${PAY_VERB}(?![A-Za-z])`),
  re(String.raw`(?:claim|release|inaam|receive|lene|prize|unlock)[^.\n]{0,60}?${AMT}[^.\n]{0,40}?(?<![A-Za-z])${PAY_VERB}(?![A-Za-z])`),
  re(String.raw`(?<![A-Za-z])(?:send|bhej\w*|jama|pay|deposit)(?![A-Za-z])[^.\n]{0,40}?${AMT}[^.\n]{0,50}?(?:to (?:claim|receive|release|get|confirm)|claim|release|prize|inaam|lene ke liye)`),
];
// "Joining fee Rs 1000 only. WhatsApp 0300..." has no "pay": a joining-type fee, an amount and a mobile number
const UPFRONT_FEE = re(String.raw`\b(joining|registration|processing|verification|application|activation|security)\s+(fee|fees|charges?)\b`);
const AMOUNT = re(AMT);
// Paying the delivery rider is normal. It only stays a "fee" if there is a link or a number to pay to.
const DELIVERY_CHARGES = /\b(delivery (?:charges?|fee)|cash on delivery|cod charges?|cod)\b/gi;
const MOBILE = /(?<!\d)(?:\+?92[- ]?|0)3\d{2}[- ]?\d{7}(?!\d)/;
const CONTACT = re(String.raw`\b(call|rabta|raabta|contact|dial|whatsapp)\b|رابطہ|کال`);

const hasUnofficialLink = (text) => findLinks(text).some((link) => !isOfficial(hostOf(link)));

function asksForFee(text) {
  const payTarget = MOBILE.test(text) || hasUnofficialLink(text);
  if (UPFRONT_FEE.test(text) && AMOUNT.test(text) && payTarget) return true;
  const checked = payTarget ? text : text.replace(DELIVERY_CHARGES, ' ');
  return FEE_PATTERNS.some((p) => p.test(checked));
}

// ---- the other flags
// A prize noun, or a "you won" phrase. "Congratulations" or "Mubarak ho" alone are ordinary words.
const PRIZE = re(String.raw`(\bwon\b(?!')|\bwinner\b|jeet gaye|jeet chuke|jeeta hai|jeeti hai|\bjeeta\b|lucky draw|lottery|jackpot|jeeto pakistan|\bprize\b|\binaam\b|انعام|لاٹری|جیت)`);
const BISP = re(String.raw`\b(bisp|benazir|ehsaas|kafalat)\b|بینظیر|بے نظیر|احساس`);
const BISP_TRIGGER = re(String.raw`(claim|selected|inaam|prize|winner|mubarak|congrat|apply|register|verify now|processing|bhej\w*|jama|send your)`);
const BISP_LINK_WORDS = re(String.raw`(click|link|http)`);
// With a mobile number to contact, these are a trap too: real BISP never asks you to call a mobile
const BISP_PHONE_TRIGGER = re(String.raw`\b(call|rabta|raabta|raqam|whatsapp|contact)\b|رابطہ|کال|رقم`);
// The SENDER is 8171 (the message starts with it). "8171" somewhere inside the text proves nothing.
const FROM_8171 = re(String.raw`^\s*(?:(?:from|sender)\s*:?\s*)?(?:bisp\s+)?8171\s*[:\-]`);
const WRONG_A = re(String.raw`(by mistake|mistakenly|accidentally|galti se|ghalti se|ghalat|wrong (?:number|transfer|account)|غلطی سے)`);
const WRONG_B = re(String.raw`(send (?:it |the money |the amount )?back|return|wapas|refund|bhej\w*|لوٹا|واپس)`);
const BLOCK = re(String.raw`(block|suspend|deactivat|freeze|frozen|close[d]? today|expire|band ho|band kar|بند)`);
const VERIFY = re(String.raw`(verify|click|update your|confirm your|reactivat)`);
const COURIER = re(String.raw`\b(parcel|courier|package|shipment|delivery|customs|tcs|leopards|dhl|fedex|postex|pakistan post)\b`);
const JOB = re(String.raw`\b(job|hiring|vacancy|vacancies|naukri|visa|work from home|offer letter|recruit\w*)\b`);

// How many independent red flags are needed to call it a scam without the server.
export const OFFLINE_MIN_FLAGS = 2;
// Flags that only follow from another one. They do not count toward the two.
const DERIVED = ['courier', 'job'];

// flags: every red flag. strong: enough on its own (the server trusts these over the AI).
// independent: found by themselves.
export function checkScam(text) {
  const t = String(text || '');
  const flags = [];
  const derived = [...DERIVED];
  const links = suspiciousLinks(t);
  const secret = asksForSecret(t);
  const fee = asksForFee(t);
  const mobile = MOBILE.test(t);

  if (fee) flags.push('fee');
  if (secret) flags.push('secret');
  if (BISP.test(t)) {
    const from8171 = FROM_8171.test(t);
    const own = fee || secret
      || (BISP_TRIGGER.test(t) && !from8171)
      || (mobile && BISP_PHONE_TRIGGER.test(t));
    const fromLink = links.length > 0 || (BISP_LINK_WORDS.test(t) && !from8171);
    if (own || fromLink) {
      flags.push('bisp');
      if (!own) derived.push('bisp');
    }
  }
  if (PRIZE.test(t)) flags.push('prize');
  if (WRONG_A.test(t) && WRONG_B.test(t)) flags.push('wrong_transfer');
  if (BLOCK.test(t) && (links.length || secret || VERIFY.test(t) || (mobile && CONTACT.test(t)))) flags.push('threat');
  if (links.length) flags.push('link');
  if (COURIER.test(t) && (fee || links.length)) flags.push('courier');
  if (JOB.test(t) && fee) flags.push('job');

  const independent = flags.filter((flag) => !derived.includes(flag));
  // A link is strong when its name copies a brand, or when it is short or cheap AND asks you to act
  const hosts = links.map(hostOf);
  const strongLink = hosts.some(isLookalike) || (hosts.some(isCheap) && ACTION_WORDS.test(t));
  const strong = independent.filter((flag) => flag !== 'link' || strongLink);
  return { flags, strong, independent };
}

// Returns the list of red flags: "fee", "secret", "bisp", "prize", "wrong_transfer", "threat", "link", "courier", "job"
export const scamFlags = (text) => checkScam(text).flags;

// { isScam, flags }  isScam is true when 2 or more independent flags match.
export function offlineScamCheck(text) {
  const { flags, independent } = checkScam(text);
  return { isScam: independent.length >= OFFLINE_MIN_FLAGS, flags };
}
