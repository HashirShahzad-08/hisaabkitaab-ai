// "Load demo data": replaces the signed-in user's data with a sample month (for showing the app).
// Everything is dated relative to today, so it always looks current.
import { collection, doc, getDocs, Timestamp, writeBatch } from 'firebase/firestore';

import { db } from '../firebase';
import en from '../i18n/en.json';
import ur from '../i18n/ur.json';
import { toDateKey } from '../utils/format';

const COLLECTIONS = ['transactions', 'bills', 'budgets', 'goals'];
const BATCH_SIZE = 400; // Firestore allows 500 writes per batch

// [day (1-28, spread over the month so far), amount, category, paymentType, merchant, note, source]
// Spending is about 68% of the Rs 85,000 salary. Food is about 85% of its budget, Transport about 50%.
const EXPENSES = [
  [1, 12000, 'Education', 'Bank card', 'City School', 'School fees', 'sms'],
  [1, 6000, 'Food', 'Cash', 'Al-Fatah Store', 'Monthly ration', 'manual'],
  [2, 800, 'Food', 'Cash', 'Sabzi mandi', 'Sabzi', 'manual'],
  [3, 1500, 'Food', 'Cash', 'Doodh wala', 'Doodh', 'manual'],
  [4, 9800, 'Bills', 'Bank card', 'IESCO', 'Electricity bill', 'sms'],
  [4, 1200, 'Transport', 'Cash', 'PSO', 'Petrol', 'manual'],
  [5, 600, 'Mobile', 'JazzCash', 'Jazz', 'Mobile load', 'sms'],
  [6, 2400, 'Bills', 'Easypaisa', 'SNGPL', 'Gas bill', 'sms'],
  [7, 250, 'Transport', 'Cash', 'Rickshaw', 'Rickshaw to market', 'manual'],
  [8, 650, 'Food', 'Cash', 'Sabzi mandi', 'Sabzi', 'manual'],
  [9, 1500, 'Food', 'Cash', 'Doodh wala', 'Doodh', 'manual'],
  [10, 8000, 'Family', 'JazzCash', 'Ammi', 'Sent to family', 'sms'],
  [11, 1850, 'Health', 'Cash', 'Medicare Pharmacy', 'Medicine', 'manual'],
  [13, 1800, 'Food', 'Cash', 'Chicken shop', 'Chicken', 'voice'],
  [14, 900, 'Food', 'Cash', 'Sabzi mandi', 'Sabzi', 'manual'],
  [15, 1600, 'Food', 'Cash', 'Doodh wala', 'Doodh', 'manual'],
  [16, 300, 'Transport', 'Cash', 'Rickshaw', 'Rickshaw', 'manual'],
  [18, 1500, 'Shopping', 'Cash', 'Saddar Bazaar', 'Kids clothes', 'manual'],
  [19, 400, 'Mobile', 'Easypaisa', 'Telenor', 'Mobile load', 'sms'],
  [20, 700, 'Food', 'Cash', 'Sabzi mandi', 'Sabzi', 'manual'],
  [22, 1000, 'Transport', 'Cash', 'PSO', 'Petrol', 'manual'],
  [23, 1550, 'Food', 'Cash', 'Doodh wala', 'Doodh', 'manual'],
  [25, 950, 'Health', 'Cash', 'Medicare Pharmacy', 'Medicine', 'manual'],
  [26, 250, 'Transport', 'Cash', 'Rickshaw', 'Rickshaw', 'manual'],
  [28, 400, 'Other', 'Cash', 'Tailor', 'Stitching', 'manual'],
];

const pad = (n) => String(n).padStart(2, '0');
const monthKeyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

function buildTransactions(now) {
  const todayDay = now.getDate();
  const make = (day, hour, minute, fields) => {
    const when = new Date(now.getFullYear(), now.getMonth(), day, hour, minute);
    return {
      ...fields,
      date: toDateKey(when),
      dateTime: Timestamp.fromDate(when),
      createdAt: Timestamp.fromDate(when),
    };
  };
  const list = [
    make(1, 9, 30, {
      amount: 85000, type: 'income', category: 'Income', paymentType: 'Bank card',
      merchant: 'Employer', note: 'Salary', source: 'manual',
    }),
  ];
  EXPENSES.forEach(([d, amount, category, paymentType, merchant, note, source], i) => {
    const day = Math.min(todayDay, Math.max(1, Math.ceil((d / 28) * todayDay)));
    list.push(make(day, 8 + ((i * 7) % 13), (i * 13) % 60, {
      amount, type: 'expense', category, paymentType, merchant, note, source,
    }));
  });
  return list;
}

function buildBills(now, lang) {
  const isUr = lang === 'ur';
  const months = (isUr ? ur : en).months.long;
  const lastLabel = `${months[new Date(now.getFullYear(), now.getMonth() - 1, 1).getMonth()]} ${new Date(now.getFullYear(), now.getMonth() - 1, 1).getFullYear()}`;
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const before = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  // Last month: billed 235 units, the meter shows 190 -> 45 extra units
  const lastRequest = {
    lang: isUr ? 'ur' : 'en', company: 'IESCO', bill_month: monthKeyOf(last),
    previous_reading: 41310, current_reading: 41500, units_billed: 235, amount: 9800,
    last_month_units: 205,
  };
  const lastResult = {
    verdict: 'likely_overbilled',
    reading_units: 190,
    units_billed: 235,
    extra_units: 45,
    cost_per_unit: 41.7,
    issues: [
      {
        code: 'units_mismatch',
        message: isUr
          ? 'بل میں 235 یونٹ لگائے گئے ہیں لیکن آپ کی ریڈنگ 190 یونٹ دکھاتی ہے۔ یہ 45 یونٹ زیادہ ہیں۔'
          : 'The bill charges 235 units but your readings show 190 units. That is 45 extra units.',
      },
      {
        code: 'above_200',
        message: isUr
          ? 'آپ نے 235 یونٹ استعمال کیے جو 200 سے اوپر ہیں۔ اس سے اوپر کے یونٹ زیادہ مہنگے لگتے ہیں۔'
          : 'You used 235 units, which is above 200. Units above this level cost more per unit.',
      },
    ],
    explanation: isUr
      ? 'میٹر کی ریڈنگ 190 یونٹ دکھاتی ہے لیکن بل میں 235 یونٹ لگائے گئے ہیں، یعنی 45 یونٹ زیادہ۔ بل 9,800 روپے ہے، تقریباً 41.7 روپے فی یونٹ۔ براہ کرم آئیسکو سے بل کی جانچ کروائیں۔'
      : 'The meter readings show 190 units but the bill charges 235, which is 45 extra units. The bill is Rs 9,800, about Rs 41.7 per unit. Please ask IESCO to check it.',
    tips: isUr
      ? [
        'ہر مہینے اپنے میٹر کی تصویر لیں۔',
        'جب ہو سکے تو اے سی کی جگہ پنکھے اور ایل ای ڈی بلب استعمال کریں۔',
        'شام کے مہنگے اوقات میں استری اور پانی کی موٹر نہ چلائیں۔',
      ]
      : [
        'Take a photo of your meter every month.',
        'Use fans and LED bulbs instead of the AC when you can.',
        'Avoid running the iron and water pump in the evening peak hours.',
      ],
    complaint: isUr
      ? `محترم آئیسکو کسٹمر سروس، ${lastLabel} کے بل میں میری ریڈنگ 41,310 (پچھلی) اور 41,500 (موجودہ) ہے، یعنی 190 یونٹ، لیکن بل میں 235 یونٹ لگائے گئے ہیں۔ یہ 45 یونٹ زیادہ ہیں۔ براہ کرم میٹر کی ریڈنگ جانچ کر بل درست کریں۔ شکریہ۔ صارف نمبر: [اپنا صارف نمبر]`
      : `Dear IESCO Customer Service, for the bill of ${lastLabel} my meter readings are 41,310 (previous) and 41,500 (current), which is 190 units, but the bill charges 235 units. That is 45 extra units. Please check my meter reading and correct the bill. Thank you. Consumer number: [your consumer number]`,
  };

  // The month before: readings match the units billed
  const beforeRequest = {
    lang: isUr ? 'ur' : 'en', company: 'IESCO', bill_month: monthKeyOf(before),
    previous_reading: 41105, current_reading: 41310, units_billed: 205, amount: 8200,
    last_month_units: 188,
  };
  const beforeResult = {
    verdict: 'looks_ok',
    reading_units: 205,
    units_billed: 205,
    extra_units: 0,
    cost_per_unit: 40,
    issues: [
      {
        code: 'above_200',
        message: isUr
          ? 'آپ نے 205 یونٹ استعمال کیے جو 200 سے اوپر ہیں۔ اس سے اوپر کے یونٹ زیادہ مہنگے لگتے ہیں۔'
          : 'You used 205 units, which is above 200. Units above this level cost more per unit.',
      },
    ],
    explanation: isUr
      ? 'آپ کا بل 8,200 روپے ہے، 205 یونٹ کے، یعنی تقریباً 40 روپے فی یونٹ۔ ریڈنگ اور بل کے یونٹ آپس میں ملتے ہیں اور کوئی غیر معمولی بات نہیں ملی۔'
      : 'Your bill is Rs 8,200 for 205 units, about Rs 40 per unit. The readings match the units billed and nothing unusual was found.',
    tips: isUr
      ? [
        '200 یونٹ سے نیچے رہنے کی کوشش کریں، کیونکہ اس سے اوپر کے یونٹ مہنگے ہیں۔',
        'اے سی کو 26 ڈگری پر رکھیں اور کم گھنٹے چلائیں۔',
        'پرانے بلب بدل کر ایل ای ڈی لگائیں۔',
      ]
      : [
        'Try to stay under 200 units, because units above that cost more.',
        'Set the AC to 26 degrees and use it for fewer hours.',
        'Replace old bulbs with LED bulbs.',
      ],
    complaint: '',
  };

  const bill = (request, result, createdDay) => ({
    billMonth: request.bill_month,
    units: request.units_billed,
    amount: request.amount,
    verdict: result.verdict,
    company: request.company,
    request,
    result,
    addedToExpenses: false,
    createdAt: Timestamp.fromDate(createdDay),
  });
  return [
    bill(lastRequest, lastResult, new Date(now.getFullYear(), now.getMonth(), 2, 11, 0)),
    bill(beforeRequest, beforeResult, new Date(now.getFullYear(), now.getMonth() - 1, 3, 11, 0)),
  ];
}

// lang: the current app language ('en' or 'ur'); the saved bills' text is written in it
export async function loadDemoData(uid, lang = 'en') {
  const now = new Date();
  const userDoc = (...path) => doc(db, 'users', uid, ...path);

  // 1. find what to delete
  const toDelete = [];
  for (const name of COLLECTIONS) {
    const snap = await getDocs(collection(db, 'users', uid, name));
    snap.forEach((d) => toDelete.push(d.ref));
  }

  // 2. everything to write
  const writes = [];
  writes.push([userDoc('profile', 'main'), { name: 'Shazia' }, { merge: true }]);
  buildTransactions(now).forEach((t) => writes.push([doc(collection(db, 'users', uid, 'transactions')), t]));
  buildBills(now, lang === 'ur' ? 'ur' : 'en').forEach((b) => writes.push([doc(collection(db, 'users', uid, 'bills')), b]));
  [['Food', 16500], ['Transport', 6000], ['Bills', 15000]].forEach(([category, limit]) =>
    writes.push([userDoc('budgets', category), { category, limit, updatedAt: Timestamp.fromDate(now) }])
  );

  const inDays = (n) => toDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
  writes.push([doc(collection(db, 'users', uid, 'goals')), {
    name: 'Eid shopping', targetAmount: 20000, savedAmount: 8000, targetDate: inDays(42),
    createdAt: Timestamp.fromMillis(now.getTime() - 1000), updatedAt: Timestamp.fromDate(now),
  }]);
  writes.push([doc(collection(db, 'users', uid, 'goals')), {
    name: 'School fees', targetAmount: 15000, savedAmount: 15000, targetDate: inDays(-5),
    createdAt: Timestamp.fromMillis(now.getTime() - 2000), updatedAt: Timestamp.fromDate(now),
  }]);

  // 3. deletes first, then writes, in batches
  const ops = [
    ...toDelete.map((ref) => ({ del: ref })),
    ...writes.map(([ref, data, options]) => ({ ref, data, options })),
  ];
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    ops.slice(i, i + BATCH_SIZE).forEach((op) => {
      if (op.del) batch.delete(op.del);
      else if (op.options) batch.set(op.ref, op.data, op.options);
      else batch.set(op.ref, op.data);
    });
    await batch.commit();
  }
}
