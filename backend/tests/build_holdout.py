"""Builds holdout_cases.json: 30 UNSEEN cases, written after the rules and prompts, with different
wording and a few traps (legit messages that look scary, scams that avoid the obvious words).
Run from the backend folder: python tests/build_holdout.py
Same conventions as eval_cases.json. today = 2026-11-23.
"""
import json
import os

from build_cases import quick, scam, sms  # same helpers

T = "2026-11-23"

cases = [
    # ---------- 10 normal SMS (some are traps) ----------
    sms("h01", "HBL: Rs 4,500 debited from A/C XXXX2210 at FOODPANDA via Card on 22-Nov-2026. Never share your OTP/PIN with anyone.", 4500, "expense", "Food", "Bank card", "2026-11-22"),
    sms("h02", "Easypaisa: Rs 25,000 received from Zainab Malik. Trx ID 7712 on 21/11/2026. Get our app: https://easypaisa.com.pk/app", 25000, "income", "Income", "Easypaisa", "2026-11-21"),
    sms("h03", "Meezan: PKR 1,250 charged at KFC GULBERG on 23-Nov-2026 using card ending 8812. Avl Limit PKR 48,750.", 1250, "expense", "Food", "Bank card"),
    sms("h04", "JazzCash: You paid Rs 650 to Daraz for order 88421. Fee Rs 10. Trx 99120044", 650, "expense", "Shopping", "JazzCash"),
    sms("h05", "UBL: Rs 30,000 withdrawn from ATM Johar Town. Bal Rs 12,480.", 30000, "expense", "Other", "Bank card"),
    sms("h06", "Aap ne Rs 2,000 Zong package ke liye ada kiye Easypaisa se. TID 66721", 2000, "expense", "Mobile", "Easypaisa"),
    sms("h07", "Rs 45,000 aap ke Bank Alfalah account mein salary ke tor par jama hue 22-Nov-2026", 45000, "income", "Income", "Bank card", "2026-11-22"),
    sms("h08", "You received Rs 800 from 0311-2223344 on JazzCash. Fee Rs 0. Trx 54112. Total balance Rs 3,900", 800, "income", "Income", "JazzCash"),
    sms("h09", "HBL: Rs 6,800 paid to LESCO bill via mobile app on 20-Nov-2026. Ref 1129", 6800, "expense", "Bills", "Bank card", "2026-11-20"),
    sms("h10", "Easypaisa: Rs 15,000 sent to Hira Khan (03451230000). TID 9981. Charges Rs 15.", 15000, "expense", "Other", "Easypaisa"),
    # ---------- 10 scam SMS ----------
    scam("hs01", "ALERT: Your Easypaisa account has been temporarily limited. Verify at bit.ly/ep-verify-now or lose access."),
    scam("hs02", "Aap ka Rs 1,50,000 ka Honda 125 inaam nikla hai Jazz Mega Draw mein. Winner banne ke liye 3000 processing fee bhejein."),
    scam("hs03", "Hi, this is Imran. I accidentally transferred Rs 22,000 to your account. Kindly return it to my other number 0300-9876543 asap."),
    scam("hs04", "Dear customer, your debit card is expired. Update your PIN and card number at hbl-secure-login.com to avoid blocking."),
    scam("hs05", "NADRA: Your CNIC is blocked. Send your CNIC number and mother name to 0333-5551212 to unblock."),
    scam("hs06", "Congratulations! Your number won Rs 25,00,000 in Nestle Promo. WhatsApp 03215554433 to claim."),
    scam("hs07", "Daraz: Your order is held at customs. Pay Rs 499 clearance charges via JazzCash 03001239999 to get delivery."),
    scam("hs08", "Government job offer in Dubai. Pay Rs 15,000 advance for visa processing to this Easypaisa number to confirm your seat."),
    scam("hs09", "Mubarak! BISP 8171 se aap ko Rs 9,000 milenge. Apna CNIC aur PIN is number par SMS karein 03441112233."),
    scam("hs10", "Your Meezan account shows a suspicious login. Call 0300-1112233 now and share your OTP to secure it."),
    # ---------- 10 quick entries ----------
    quick("hq01", "aaj subah 250 ka naashta kiya aur 1000 ka petrol",
          [(250, "expense", "Food", "Cash", T), (1000, "expense", "Transport", "Cash", T)]),
    quick("hq02", "kal sawa sau ki chai pi", [(125, "expense", "Food", "Cash", "2026-11-22")]),
    quick("hq03", "parson Easypaisa se 3 hazaar ka load kia", [(3000, "expense", "Mobile", "Easypaisa", "2026-11-21")]),
    quick("hq04", "aaj 15k rent diya aur 2.5k ka gas bill",
          [(15000, "expense", "Rent", "Cash", T), (2500, "expense", "Bills", "Cash", T)]),
    quick("hq05", "I spent 4500 on shoes yesterday and 800 on lunch today",
          [(4500, "expense", "Shopping", "Cash", "2026-11-22"), (800, "expense", "Food", "Cash", T)]),
    quick("hq06", "پرسوں 3000 کا پٹرول ڈلوایا", [(3000, "expense", "Transport", "Cash", "2026-11-21")], lang="ur"),
    quick("hq07", "ek lakh salary aaj aayi Bank Alfalah mein", [(100000, "income", "Income", "Bank card", T)]),
    quick("hq08", "aaj 600 ki dawai aur 1.2k ka doctor fees",
          [(600, "expense", "Health", "Cash", T), (1200, "expense", "Health", "Cash", T)]),
    quick("hq09", "kal bachon ki school fees 8500 jama karwayi", [(8500, "expense", "Education", "Cash", "2026-11-22")]),
    quick("hq10", "do sau ka mobile package aur teen sau ka khana, dono aaj JazzCash se",
          [(200, "expense", "Mobile", "JazzCash", T), (300, "expense", "Food", "JazzCash", T)]),
]

assert len(cases) == 30
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "holdout_cases.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(cases, f, ensure_ascii=False, indent=2)
print("wrote", len(cases), "holdout cases to", out)
