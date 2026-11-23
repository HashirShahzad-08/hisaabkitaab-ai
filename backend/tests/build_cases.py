"""Builds eval_cases.json. Run from the backend folder: python tests/build_cases.py

All cases use today = 2026-11-23, so relative dates have fixed answers.
Rules for the expected values:
  groceries and restaurants -> Food, fuel and rides -> Transport, bills -> Bills, load -> Mobile,
  salary and money received from a person -> Income, money sent to a person and ATM cash -> Other,
  card or bank alerts -> paymentType "Bank card".
"""
import json
import os

T = "2026-11-23"


def sms(id, text, amount, type, category, pay, date=T, lang="en"):
    return {"id": id, "kind": "sms", "lang": lang, "today": T, "text": text,
            "expected": {"isScam": False, "amount": amount, "type": type, "category": category,
                         "paymentType": pay, "date": date}}


def scam(id, text, lang="en"):
    return {"id": id, "kind": "sms", "lang": lang, "today": T, "text": text, "expected": {"isScam": True}}


def quick(id, text, items, lang="en"):
    keys = ("amount", "type", "category", "paymentType", "date")
    return {"id": id, "kind": "quick", "lang": lang, "today": T, "text": text,
            "expected": {"transactions": [dict(zip(keys, i)) for i in items]}}


cases = [
    # ---------- 15 normal SMS ----------
    sms("n01", "Rs 1,500 received from Ali via JazzCash. Trx ID 12345", 1500, "income", "Income", "JazzCash"),
    sms("n02", "You have sent Rs 2,000 to 0300-1234567 (Usman Khan) via JazzCash. Fee Rs 0. Trx ID 8821764532. Balance Rs 5,430.", 2000, "expense", "Other", "JazzCash"),
    sms("n03", "Dear Customer, Rs 3,500.00 has been received from Bilal Ahmed in your Easypaisa account. TID 4412908765. Balance: Rs 7,120.50", 3500, "income", "Income", "Easypaisa"),
    sms("n04", "Your K-Electric bill payment of Rs 8,450 was successful via Easypaisa. TID 77231044. Date 20-Nov-2026", 8450, "expense", "Bills", "Easypaisa", "2026-11-20"),
    sms("n05", "Aap ne Rs 500 ka Jazz load kia hai 03001234567 ke liye. Trx ID 99120 via JazzCash.", 500, "expense", "Mobile", "JazzCash"),
    sms("n06", "HBL: Rs 12,000 debited from A/C XXXX4521 on 21-Nov-2026 at 14:32 via ATM Cash Withdrawal. Avl Bal Rs 45,300.", 12000, "expense", "Other", "Bank card", "2026-11-21"),
    sms("n07", "Meezan Bank: Your account XXXX7788 has been credited with PKR 25,000 via IBFT from Hamza Raza on 22-Nov-2026. Ref 5581023", 25000, "income", "Income", "Bank card", "2026-11-22"),
    sms("n08", "UBL Digital: PKR 120,000.00 credited to your account ending 3321 - SALARY NOV 2026 - 23-Nov-2026", 120000, "income", "Income", "Bank card"),
    sms("n09", "Meezan Bank Card ending 4410 used for PKR 3,850 at IMTIAZ SUPER MARKET KHI on 22-Nov-2026. Avl Limit PKR 96,150.", 3850, "expense", "Food", "Bank card", "2026-11-22"),
    sms("n10", "UBL: Rs 5,000 spent on your Debit Card ending 9087 at SHELL PETROL PUMP LAHORE on 23-NOV-26.", 5000, "expense", "Transport", "Bank card"),
    sms("n11", "Aap ke Easypaisa account se Rs 1,200 Careem ko ada kiye gaye. TID 55012344.", 1200, "expense", "Transport", "Easypaisa"),
    sms("n12", "Aap ko Rs 5,000 mosool hue hain 03451234567 se JazzCash par. Trx ID 77821.", 5000, "income", "Income", "JazzCash"),
    sms("n13", "Your SNGPL gas bill of Rs 2,340 has been paid successfully via JazzCash. Trx ID 3345109.", 2340, "expense", "Bills", "JazzCash"),
    sms("n14", "HBL: Rs 18,500 transferred to ABDUL REHMAN via IBFT on 19-Nov-2026. Ref 2290011. Bal Rs 22,100", 18500, "expense", "Other", "Bank card", "2026-11-19"),
    sms("n15", "Easypaisa: Rs 100 ka mobile load Zong number 03121234567 par kamyabi se bhej diya gaya. TID 8872", 100, "expense", "Mobile", "Easypaisa"),
    # ---------- 15 scam SMS ----------
    scam("s01", "BISP: Mubarak ho! Aap ka Benazir Kafalat 25,000 ka inaam nikla hai. Claim karne ke liye 500 rupay JazzCash par bhejein 03001112223."),
    scam("s02", "Benazir Income Support: Your CNIC is selected for Rs 12,500 payment. Verify now at http://bisp-pk.top/claim"),
    scam("s03", "Congratulations! You have won Rs 5,000,000 in Jeeto Pakistan Lucky Draw. Call 0321-5550000 to claim your prize."),
    scam("s04", "Aap ki Rs 10 lakh ki lottery nikli hai Samsung Lucky Draw mein. Inaam lene ke liye apna CNIC aur account number bhejein."),
    scam("s05", "Brother Rs 15,000 galti se aap ke JazzCash mein chale gaye hain. Please wapas bhej dein 03451239876, bohat mehrbani."),
    scam("s06", "Sorry I sent Rs 8,000 to your Easypaisa by mistake. Please send it back to this number urgently."),
    scam("s07", "Dear customer your HBL account will be blocked today. Share the 6-digit OTP you received to verify your identity."),
    scam("s08", "Meezan Bank Alert: Your account is suspended. Reply with your CNIC and ATM PIN to reactivate immediately."),
    scam("s09", "TCS: Your parcel is on hold. Pay Rs 350 customs fee at http://tcs-delivery.cfd/pay to receive it."),
    scam("s10", "Aap ka parcel Leopards Courier ke paas hai. Delivery charges Rs 250 Easypaisa 03331234567 par bhejein warna wapas ho jayega."),
    scam("s11", "Urgent hiring! Work from home Rs 80,000/month. Send Rs 3,000 registration fee on JazzCash 03001234567 to confirm your job."),
    scam("s12", "Naukri ka offer: Dubai company mein visa tayyar hai. Security deposit Rs 20,000 abhi Easypaisa karein."),
    scam("s13", "Your JazzCash account is locked. Click http://jazzcash-verify.xyz/login to unlock now."),
    scam("s14", "Aap ke account mein Rs 50,000 aane wale hain. Release karne ke liye processing fee Rs 2,500 pehle jama karwayein."),
    scam("s15", "Ehsaas Program: Apply for Rs 25,000 Ramzan relief. Send your CNIC number and PIN to 0345-1112222 to register."),
    # ---------- 10 quick entries ----------
    quick("q01", "aaj 800 ka petrol aur 300 ka doodh",
          [(800, "expense", "Transport", "Cash", T), (300, "expense", "Food", "Cash", T)]),
    quick("q02", "kal mainy 100 ka petrol barwaya", [(100, "expense", "Transport", "Cash", "2026-11-22")]),
    quick("q03", "parson 1.5k ki grocery li", [(1500, "expense", "Food", "Cash", "2026-11-21")]),
    quick("q04", "aaj dhai sau ka khana khaya", [(250, "expense", "Food", "Cash", T)]),
    quick("q05", "do hazaar ka mobile load kiya JazzCash se", [(2000, "expense", "Mobile", "JazzCash", T)]),
    quick("q06", "کل میں نے 500 روپے کی دوائی خریدی", [(500, "expense", "Health", "Cash", "2026-11-22")], lang="ur"),
    quick("q07", "آج بجلی کا بل 6500 ادا کیا", [(6500, "expense", "Bills", "Cash", T)], lang="ur"),
    quick("q08", "Yesterday I paid 12000 rent and 1500 for electricity bill",
          [(12000, "expense", "Rent", "Cash", "2026-11-22"), (1500, "expense", "Bills", "Cash", "2026-11-22")]),
    quick("q09", "salary 85000 mili Meezan bank mein aaj", [(85000, "income", "Income", "Bank card", T)]),
    quick("q10", "kal 2k ka petrol aur aaj 500 ka khana, dono cash",
          [(2000, "expense", "Transport", "Cash", "2026-11-22"), (500, "expense", "Food", "Cash", T)]),
]

if __name__ == "__main__":
    assert len(cases) == 40
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "eval_cases.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(cases, f, ensure_ascii=False, indent=2)
    print("wrote", len(cases), "cases to", out)
