"""Builds trap_cases.json: legitimate messages that LOOK scary (false-alarm traps) and scams that avoid
the obvious words. Only isScam is scored. Run from the backend folder: python tests/build_traps.py
"""
import json
import os

T = "2026-11-23"


def case(id, text, is_scam, lang="en"):
    return {"id": id, "kind": "sms", "lang": lang, "today": T, "text": text, "expected": {"isScam": is_scam}}


cases = [
    # ---------- legitimate messages that look scary ----------
    case("t01", "JazzCash: Your OTP is 482915. Do not share it with anyone. Valid for 5 minutes.", False),
    case("t02", "HBL: Rs 2,500 debited at ATM Gulshan. If you did not make this transaction, call 111-111-425 immediately.", False),
    case("t03", "K-Electric: Your bill of Rs 7,420 for Oct is due on 28-Nov-2026. Pay via our app or www.ke.com.pk", False),
    case("t04", "TCS: Your parcel 4455 is out for delivery today. Track it at https://www.tcsexpress.com/track", False),
    case("t05", "Easypaisa: Rs 1,000 received from Ahmed. Trx 3321. Never share your PIN or OTP with anyone.", False),
    case("t06", "Meezan: Your payment of Rs 5,000 to PTCL was successful. Fee Rs 0. Ref 9921", False),
    case("t07", "BISP: Aapki Kafalat qist Rs 10,500 jari ho gayi hai. Apne qareebi retailer se CNIC dikha kar wasool karein. Helpline 0800-26477.", False),
    case("t08", "Jazz: You have purchased Weekly Super Card for Rs 300. Valid till 30-Nov-2026. Dial *111# for details.", False),
    case("t09", "UBL: Rs 800 debited from your card at CAREEM. If this was not you, block your card in the UBL Digital app or call 111-825-888.", False),
    case("t10", "Bank Alfalah: Your October account statement is ready. Download it at https://www.bankalfalah.com/statements", False),
    case("t11", "BISP: Aap ki Rs 13,500 ki qist jari ho chuki hai. Qareebi retailer se wasool karein. Kisi ko apna PIN na batayen.", False),
    case("t12", "Benazir Kafalat: Your payment for Q4 is ready for collection. Please visit your nearest retailer with your original CNIC.", False),
    case("t13", "SBP reminder: Banks never ask for your PIN, OTP or card number by SMS or call. Report fraud to your bank.", False),
    # ---------- scams that avoid the obvious words ----------
    case("ts01", "Dear user, claim your Ehsaas Rs 12,000 rashan relief now: ehsaas-rashan.pk/apply", True),
    case("ts02", "Aap ke JazzCash account se Rs 49,999 ki transaction ho rahi hai. Cancel karne ke liye 03001239988 par call karein aur apna OTP batayen.", True),
    case("ts03", "Your parcel could not be delivered due to a wrong address. Update your address within 24 hours: tinyurl.com/pk-parcel", True),
]

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "trap_cases.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(cases, f, ensure_ascii=False, indent=2)
print("wrote", len(cases), "trap cases to", out)
