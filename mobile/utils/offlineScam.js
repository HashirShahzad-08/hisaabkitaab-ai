// OFFLINE SCAM CHECK. A safety net for when the server cannot be reached.
// It mirrors the scam rules in backend/rules.py (scam_flags). Keep the two in step.
// It only finds red flags. It never reads amounts or guesses a transaction.
// English and Roman Urdu keywords (plus a few Urdu-script words).

const re = (source) => new RegExp(source, 'i');

// ---- links
const URL_RE = new RegExp(
  String.raw`(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|pk|xyz|top|cfd|click|link|info|online|site|me|icu|vip|club|shop|live|biz|cc|ly|gl|tk|ml)(?:\/[^\s]*)?)`,
  'gi'
);
const OFFICIAL_DOMAINS = [
  'jazzcash.com.pk', 'jazz.com.pk', 'easypaisa.com.pk', 'telenor.com.pk', 'zong.com.pk', 'ufone.com',
  'hbl.com', 'meezanbank.com', 'ubl.com.pk', 'ubldigital.com', 'mcb.com.pk', 'abl.com', 'bankalfalah.com',
  'askaribank.com.pk', 'faysalbank.com', 'bop.com.pk', 'sbp.org.pk', 'pta.gov.pk', 'bisp.gov.pk',
  'tcsexpress.com', 'leopardscourier.com', 'postex.pk', 'pakpost.gov.pk', 'daraz.pk', 'careem.com',
  'k-electric.com', 'ke.com.pk', 'ptcl.com.pk', 'nadra.gov.pk', 'sngpl.com.pk', 'ssgc.com.pk',
  'lesco.gov.pk', 'iesco.com.pk', 'fesco.com.pk', 'mepco.com.pk', 'gepco.com.pk', 'pesco.gov.pk',
  'wapda.gov.pk', 'foodpanda.pk', 'bankislami.com.pk', 'nayatel.com', 'stormfiber.com',
];
const RISKY_ENDINGS = ['xyz', 'top', 'cfd', 'click', 'icu', 'vip', 'club', 'site', 'online', 'live', 'tk', 'ml',
  'cc', 'ly', 'gl', 'link', 'biz', 'info', 'shop'];
const SHORTENERS = ['bit.ly', 'tinyurl.com', 'cutt.ly', 't.co', 'goo.gl', 'rb.gy', 'is.gd', 'shorturl.at', 'ow.ly'];
const BRAND_WORDS = ['jazz', 'easypaisa', 'hbl', 'meezan', 'ubl', 'bisp', 'benazir', 'ehsaas', 'nadra', 'tcs', 'leopards',
  'daraz', 'bank', 'alfalah', 'askari', 'faysal', 'nbp', 'sbp', 'pta', 'ptcl', 'secure', 'verify'];
const ACTION_WORDS = re(String.raw`(verify|login|log in|click|claim|unlock|update|confirm|kyc|secure|apply|register|reactivat|limited|suspend|block|expired)`);

function findLinks(text) {
  return (text.match(URL_RE) || []).map((l) => l.replace(/[.,;)]+$/, ''));
}

function hostOf(link) {
  return link.replace(/^[a-z]+:\/\//i, '').split(/[/?#:]/)[0].toLowerCase();
}

function suspiciousLinks(text) {
  const contextRisky = ACTION_WORDS.test(text);
  return findLinks(text).filter((link) => {
    const host = hostOf(link);
    if (OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return false;
    const ending = host.split('.').pop();
    const lookalike = BRAND_WORDS.some((w) => host.includes(w));
    return SHORTENERS.includes(host) || RISKY_ENDINGS.includes(ending) || lookalike || contextRisky;
  });
}

// ---- asks for an OTP, PIN, CNIC, password or code (a warning like "do not share your OTP" does not count)
const NEG = re(String.raw`\b(do not|don't|dont|never|na|nahi|nahin|mat|not)\b`);
const VERB = String.raw`(?:share|send|give|provide|reply|enter|confirm|verify|tell|submit|text|sms|whatsapp|forward|type|bhej\w*|bata\w*|likh\w*|dein|do)`;
const SECRET = String.raw`(?:otp|pin|cnic|password|passcode|cvv|verification code|security code|(?:\d-?digit )?code|identity card|id card|account number|شناختی کارڈ|پن|پاس ورڈ)`;
const REQ_A = new RegExp(String.raw`(?<![A-Za-z])(${VERB})(?![A-Za-z])[^.\n]{0,45}?(?<![A-Za-z])(${SECRET})(?![A-Za-z])`, 'gi');
const REQ_B = new RegExp(String.raw`(?<![A-Za-z])(${SECRET})(?![A-Za-z])[^.\n]{0,40}?(?<![A-Za-z])(${VERB})(?![A-Za-z])`, 'gi');

function asksForSecret(text) {
  const lastBreak = (end) => Math.max(...['.', '!', '?', '\n'].map((c) => text.lastIndexOf(c, end - 1)));
  for (const [pattern, verbGroup] of [[REQ_A, 1], [REQ_B, 2]]) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const sentence = text.slice(lastBreak(m.index) + 1, m.index + m[0].length + 14);
      if (NEG.test(sentence)) continue;
      const verb = m[verbGroup].toLowerCase();
      if (['sms', 'text', 'whatsapp'].includes(verb)) {
        const before = text.slice(Math.max(0, m.index - 8), m.index + (verbGroup === 1 ? 0 : m[0].lastIndexOf(m[2])));
        if (/\b(by|via|through|over|on|in)\s+$/i.test(before)) continue;
      }
      return true;
    }
  }
  return false;
}

// ---- asks to pay a fee first
const FEE_WORD = String.raw`(?:fee|fees|charges?|tax|processing|registration|security|deposit|customs|advance|inaam tax|delivery charges)`;
const PAY_VERB = String.raw`(?:pay|send|deposit|transfer|jama|bhej\w*|ada|karein|karen|karwayein|kijiye|dein)`;
const AMT = String.raw`(?:rs\.?\s?\d[\d,]*|\d[\d,]*\s*(?:rupay|rupees|rs))`;
const FEE_PATTERNS = [
  re(String.raw`(?<![A-Za-z])${PAY_VERB}(?![A-Za-z])[^.\n]{0,50}?(?<![A-Za-z])${FEE_WORD}(?![A-Za-z])`),
  re(String.raw`(?<![A-Za-z])${FEE_WORD}(?![A-Za-z])[^.\n]{0,60}?(?<![A-Za-z])${PAY_VERB}(?![A-Za-z])`),
  re(String.raw`(?:claim|release|inaam|receive|lene|prize|unlock)[^.\n]{0,60}?${AMT}[^.\n]{0,40}?(?<![A-Za-z])${PAY_VERB}(?![A-Za-z])`),
  re(String.raw`(?<![A-Za-z])(?:send|bhej\w*|jama|pay|deposit)(?![A-Za-z])[^.\n]{0,40}?${AMT}[^.\n]{0,50}?(?:to (?:claim|receive|release|get|confirm)|claim|release|prize|inaam|lene ke liye)`),
];
const asksForFee = (text) => FEE_PATTERNS.some((p) => p.test(text));

// ---- the other flags
const PRIZE = re(String.raw`(you (?:have )?won|you are (?:the )?(?:lucky )?winner|congratulations|mubarak ho|jeet gaye|jeeta hai|nikli hai|nikla hai|lucky draw|lottery|jackpot|jeeto pakistan|\bprize\b|inaam|انعام|لاٹری|مبارک)`);
const BISP = re(String.raw`\b(bisp|benazir|ehsaas|kafalat)\b|بینظیر|بے نظیر|احساس`);
const BISP_TRIGGER = re(String.raw`(claim|selected|inaam|prize|winner|mubarak|congrat|apply|register|verify now|click|link|http|processing|bhej\w*|jama|send your)`);
const WRONG_A = re(String.raw`(by mistake|mistakenly|accidentally|galti se|ghalti se|ghalat|wrong (?:number|transfer|account)|غلطی سے)`);
const WRONG_B = re(String.raw`(send (?:it |the money |the amount )?back|return|wapas|refund|bhej\w*|لوٹا|واپس)`);
const BLOCK = re(String.raw`(block|suspend|deactivat|freeze|frozen|close[d]? today|expire|band ho)`);
const VERIFY = re(String.raw`(verify|click|update your|confirm your|reactivat)`);
const COURIER = re(String.raw`\b(parcel|courier|package|shipment|delivery|customs|tcs|leopards|dhl|fedex|postex|pakistan post)\b`);
const JOB = re(String.raw`\b(job|hiring|vacancy|vacancies|naukri|visa|work from home|offer letter|recruit\w*)\b`);

// How many different red flags are needed to call it a scam without the server.
export const OFFLINE_MIN_FLAGS = 2;

// Returns the list of red flags: "fee", "secret", "bisp", "prize", "wrong_transfer", "threat", "link", "courier", "job"
export function scamFlags(text) {
  const t = String(text || '');
  const flags = [];
  const links = suspiciousLinks(t);
  const secret = asksForSecret(t);
  const fee = asksForFee(t);

  if (fee) flags.push('fee');
  if (secret) flags.push('secret');
  if (BISP.test(t)) {
    const has8171 = t.includes('8171');
    if (links.length || fee || secret || (BISP_TRIGGER.test(t) && !has8171)) flags.push('bisp');
  }
  if (PRIZE.test(t)) flags.push('prize');
  if (WRONG_A.test(t) && WRONG_B.test(t)) flags.push('wrong_transfer');
  if (BLOCK.test(t) && (links.length || secret || VERIFY.test(t))) flags.push('threat');
  if (links.length) flags.push('link');
  if (COURIER.test(t) && (fee || links.length)) flags.push('courier');
  if (JOB.test(t) && fee) flags.push('job');
  return flags;
}

// { isScam, flags }  isScam is true when 2 or more flags match.
export function offlineScamCheck(text) {
  const flags = scamFlags(text);
  return { isScam: flags.length >= OFFLINE_MIN_FLAGS, flags };
}
