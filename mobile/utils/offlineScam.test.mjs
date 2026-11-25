// Quick checks for offlineScam.js. Run from the mobile folder: node utils/offlineScam.test.mjs
import { offlineScamCheck } from './offlineScam.js';

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
console.log(bad ? `\n${bad} of ${cases.length} FAILED` : `\nAll ${cases.length} passed`);
process.exit(bad ? 1 : 0);
