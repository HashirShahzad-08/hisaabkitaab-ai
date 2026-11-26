// Quick checks for offlineScam.js. Run from the mobile folder: node utils/offlineScam.test.mjs
import { readFileSync } from 'node:fs';
import { checkScam, offlineScamCheck } from './offlineScam.js';

const cases = [
  // [expected isScam, text]
  [true, 'BISP: Mubarak ho! Aap ka 25,000 inaam nikla hai. Claim karne ke liye processing fee Rs 500 jama karwayein: http://bit.ly/bisp-claim'],
  [true, 'Congratulations! You won Rs 500,000 in the lucky draw. Send Rs 2,000 tax to claim your prize. Reply with your CNIC.'],
  [true, 'Dear customer your JazzCash account will be blocked today. Click http://jazz-verify.xyz and send your OTP to verify.'],
  [true, 'Ghalti se aap ke account mein Rs 15,000 aa gaye hain. Meherbani karke wapas bhej dein. Apna PIN share karein confirm karne ke liye.'],
  [true, 'Your parcel is held at customs. Pay delivery charges Rs 300 at https://tcs-delivery.top/pay to release it.'],
  [false, 'Rs 1,500 received from Ali via JazzCash. Trx ID 12345'],
  [false, 'You have sent Rs 2,000 to 0300-1234567 via JazzCash. Fee Rs 0. Trx ID 8821764532. Balance Rs 5,430.'],
  [false, 'Do not share your OTP with anyone. Banks never ask for your PIN by SMS. - HBL'],
  [false, 'BISP: Aap ki qist Rs 10,500 jaari ho gayi hai. Mazeed maloomat ke liye 8171 par rabta karein.'],
  [false, 'Your IESCO bill for October is Rs 9,800. Pay at https://www.iesco.com.pk before the due date.'],
  [false, 'Aaj 800 ka petrol aur 300 ka doodh'],
];

let bad = 0;
for (const [expected, text] of cases) {
  const { isScam, flags } = offlineScamCheck(text);
  const ok = isScam === expected;
  if (!ok) bad += 1;
  console.log(`${ok ? 'ok ' : 'BAD'}  scam=${String(isScam).padEnd(5)} flags=[${flags.join(',')}]  ${text.slice(0, 56)}`);
}
// The same examples as the server's rules: here we check the red flags themselves.
// [expected strong flag, text]
const ruleCases = [
  [false, 'Enter OTP 1234 to confirm your transaction of Rs 5000 at Daraz.'],
  [false, 'Your verification code is 7788. Enter this code in the app'],
  [false, 'Your Daraz parcel will be delivered today. Please pay Rs 150 delivery charges to the rider.'],
  [false, 'Mubarak ho! Aap ki tankhwah Rs 85,000 credit ho gayi'],
  [false, 'Congratulations! Your credit card payment received'],
  [false, 'Your order is confirmed. Track at www.khaadi.com/orders'],
  [true, 'HBL: Rs 50,000 credited to your A/C. Details: hbl-rewards.app/login'],
  [true, 'Ghabrayen nahi, apna PIN is number par bhej dein'],
  [true, "Don't worry, just send your OTP to 03001234567"],
  [true, 'Your account is blocked. Call 0300-1234567 immediately.'],
  [true, 'Aap ka account band ho gaya, call karein 03001234567'],
  [true, 'Ehsaas program: Aap ke Rs 12000 lene ke liye call karein 03001234567'],
  [true, 'Joining fee Rs 1000 only. WhatsApp 03001234567'],
];
console.log('\nRed flags (strong flag expected or not)');
for (const [expected, text] of ruleCases) {
  const { flags, strong } = checkScam(text);
  const ok = (strong.length > 0) === expected;
  if (!ok) bad += 1;
  console.log(`${ok ? 'ok ' : 'BAD'}  strong=[${strong.join(',')}] flags=[${flags.join(',')}]  ${text.slice(0, 56)}`);
}

// Every server test case must give the same answer on the phone
let compared = 0;
for (const file of ['eval_cases.json', 'holdout_cases.json', 'trap_cases.json']) {
  const url = new URL(`../../backend/tests/${file}`, import.meta.url);
  for (const c of JSON.parse(readFileSync(url, 'utf8'))) {
    if (c.kind !== 'sms') continue;
    compared += 1;
    if ((checkScam(c.text).strong.length > 0) !== c.expected.isScam) {
      bad += 1;
      console.log(`BAD  ${file} ${c.id}  ${c.text.slice(0, 70)}`);
    }
  }
}
console.log(`Compared with ${compared} server test cases`);

const total = cases.length + ruleCases.length + compared;
console.log(bad ? `\n${bad} of ${total} FAILED` : `\nAll ${total} passed`);
process.exit(bad ? 1 : 0);
