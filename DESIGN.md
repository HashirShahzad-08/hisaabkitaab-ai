# HisaabKitaab AI — Design Guide

> **Hisaab bhi, hifazat bhi.** A calm, trustworthy, premium fintech look with a warm Pakistani touch.
> Every screen must follow this file. When in doubt: clean, calm dark surfaces, big readable numbers.

---

## 1. Design principles

1. **Numbers first.** Money amounts are the biggest, boldest thing on any screen.
2. **One action per screen.** Each screen has one clear primary button.
3. **Calm by default, loud only for danger.** Charcoal and blue everywhere; amber for budgets, red only for scams and overbilling.
4. **Two complete languages.** The whole app exists in **English** and in **Urdu (Urdu script, right-to-left)**. The user picks one in Settings and every screen, label, alert and AI reply follows it. No mixing within one language mode (see section 10).
5. **Every tap gives feedback.** Animation, haptic, or a snackbar — never silence.
6. **No emojis anywhere in the UI.** Not in buttons, labels, alerts or AI replies. Meaning comes from real icons (Ionicons), color and motion. Emojis make an app look cheap and auto-generated.
7. **Feels alive, not busy.** Things respond to the finger with spring physics, numbers move, icons animate on state change — but every motion is short and purposeful.
8. **Dark theme only** ("Charcoal + Blue").

---

## 2. Colors: "Charcoal + Blue"

Dark theme. All values live in `mobile/theme/tokens.js`; screens import from `mobile/theme`. **No green anywhere.**

| Token | Hex | Use |
|---|---|---|
| `background` | `#0E0F12` | Screen background, splash |
| `card` | `#17181C` | Cards, inputs |
| `cardRaised` | `#1E2026` | Dialogs, menus, snackbar, avatars, icon boxes |
| `border` | `#26282E` | Card and input borders |
| `divider` | `#202228` | Lines between rows |
| `tabBar` | `#121316` | Bottom tab bar |
| `textPrimary` | `#F3F4F6` | Main text, expense amounts |
| `textSecondary` | `#C9CCD3` | Body text on cards |
| `textMuted` | `#9A9DA6` | Labels, dates, captions, inactive tabs |
| `blue` | `#3B82F6` | Primary buttons, progress bars, center + button |
| `blueLight` | `#60A5FA` | Active tab, links, income amounts |
| `blueHover` | `#93C5FD` | Pressed and strong accent text |

**Hero card (Home balance):** gradient 160deg `#2563EB` to `#1E3A8A`, border `#3B6FE0`, text `#FFFFFF` / `#C7D7FE`.

**Warning (budgets, "check" verdicts):** card `#1F1A12`, border `#4A3A1A`, icon `#E9B949`, title `#F5E6C4`, body `#BFA97A`.

**Danger (scam alert, likely overbilled):** `#EF4444`, card `#2A1416`, border `#5C2326`, text `#FECACA`.

**Health Score bands:** Excellent `#FBBF24`, Good `#60A5FA`, Okay `#F59E0B`, Needs care `#F87171`. On the blue hero card the ring is white.

**Bill verdict chips:** looks_ok `#60A5FA`, check `#E9B949`, likely_overbilled `#EF4444`.

Amounts: income `#60A5FA` with `+`; expenses in `textPrimary` with a minus.

### Category colors and icons (Ionicons)

Only blue tints, neutral greys and amber. Icons sit in a rounded square on `cardRaised`.

| Category | Color | Icon |
|---|---|---|
| Food | `#E9B949` | `fast-food` |
| Transport / Petrol | `#60A5FA` | `car` |
| Bills | `#FBBF24` | `flash` |
| Shopping | `#93C5FD` | `bag-handle` |
| Health | `#3B82F6` | `medkit` |
| Education | `#BFDBFE` | `school` |
| Mobile / Internet | `#5B8DEF` | `phone-portrait` |
| Family / Gifts | `#D9A441` | `gift` |
| Rent | `#C9CCD3` | `home` |
| Other | `#9A9DA6` | `ellipsis-horizontal` |
| Income (Salary etc.) | `#60A5FA` | `wallet` |

### Payment type chips

| Type | Label | Color |
|---|---|---|
| Cash | Cash | `#9A9DA6` |
| JazzCash | JazzCash | `#E9B949` |
| Easypaisa | Easypaisa | `#60A5FA` |
| Bank card | Bank Card | `#93C5FD` |

(Plain colored text chips — do **not** use the real company logos.)

---

## 3. Typography

- **English:** Poppins (`@expo-google-fonts/poppins`) — 400 Regular, 500 Medium, 600 SemiBold, 700 Bold
- **Urdu mode:** Noto Nastaliq Urdu (`@expo-google-fonts/noto-nastaliq-urdu`) for all text. Nastaliq is tall, so in Urdu mode use font sizes about 10% smaller than the English table below and `lineHeight` = 1.9 × fontSize. Money amounts and numbers stay in Poppins in both languages so they line up.

| Style | Size | Weight | Use |
|---|---|---|---|
| `display` | 34 | Bold | Balance on Home, amount on Add screen |
| `h1` | 24 | SemiBold | Screen titles |
| `h2` | 18 | SemiBold | Card titles, section headers |
| `body` | 15 | Regular | Normal text |
| `bodyMedium` | 15 | Medium | List item titles |
| `caption` | 12 | Regular | Dates, helper text (textSecondary) |
| `amount` | 16 | SemiBold | Amounts in lists (income light blue, expense primary text, with "Rs") |

**Money format:** always `Rs 12,500` (comma thousands, no decimals). Income shown as `+Rs 5,000` in light blue, expense as `−Rs 800` in primary text.

---

## 4. Layout and shape

- **Spacing:** 8pt grid (4 as a half step): 4, 8, 16, 24, 32. Screen side padding = **16**. Gap between cards = **16**.
- **Corner radius:** inputs and buttons **12**, cards **18**, hero card **24**, chips and pills **999**.
- **Cards:** 1px `border`, no shadows.
- **Buttons:** height **52**, full width at the bottom of forms, Poppins SemiBold 16.
- **Touch targets:** at least 44 × 44.
- **Safe areas:** use `SafeAreaView` on every screen.

---

## 5. Component library

- **React Native Paper (Material 3)** with the custom dark theme: `TextInput`, `Dialog`, `Snackbar`, `Switch`, `Checkbox`, `RadioButton`.
- **Icons:** `@expo/vector-icons` (Ionicons).
- **Charts:** `react-native-gifted-charts` for the spending donut; the units-per-month bar chart is drawn with Moti.
- **Animations:** `moti` and React Native `Animated`.
- **Haptics:** `expo-haptics`.
- **Gradient:** `expo-linear-gradient`.
- **Voice output:** `expo-speech`, `ur-PK` in Urdu and `en-US` in English.

Shared building blocks live in `mobile/components/ui/` (`Card`, `HeroCard`, `SectionHeader`, `IconTile`, `AmountText`, `AmountInput`, `Chip`, `SegmentedControl`, `FormInput`, `DateField`, `PrimaryButton`, `SecondaryButton`, `ProgressBar`, `Skeleton`, `ListSkeleton`, `EmptyState`, `ListRow`, `RadioCard`, `StatGrid`, `VerdictCard`, `ScoreRing`, `SpeakerButton`, `KeyboardAvoider`). Feature components such as `BalanceHero`, `ScamAlert`, `BudgetCard`, `GoalCard`, `AIThinking` and `PressableScale` live in `mobile/components/`.

---

## 6. Motion and feedback

| Moment | What happens |
|---|---|
| Screen opens | Sections fade in and slide up 12px once, staggered about 80ms (Moti) |
| Home opens | Balance counts up from 0; Health Score ring fills from 0 (800ms) |
| Save | Button shows a spinner, light haptic, then the screen goes back |
| Goal reached | The card gets a gold border, a gold progress bar and a "Goal reached" badge |
| Scam detected | Red scam card slides in and shakes once, gently; error haptic |
| Budget at 80% or more | Amber warning card on Home |
| AI working | `AIThinking` skeleton card with a status text that changes every 1.5s |
| Delete a transaction | Swipe in History, red delete action, then a confirm dialog |
| Lists | Pull to refresh |

Use **spring** animations for anything the finger touches. No transition is longer than 1 second. Only loading placeholders loop.

### Micro-interactions

| Element | Behavior |
|---|---|
| Pressable cards and buttons | Scale to 0.97 while pressed, spring back, light haptic |
| Bottom tab icons | Active tab switches from outline to filled icon, bounces once, a small blue pill sits under it |
| Center + button | Rotates 45 degrees into an x while the Add sheet is open |
| Amounts on Home | Roll to the new value whenever they change |
| Charts and bars | The donut sweeps in; bars grow |
| AI result | Result cards appear one by one with a soft fade and rise |
| Inputs | Blue border on focus; errors appear under the field |

Icons: Ionicons only. The app uses no illustration or animation files.

## 7. Navigation

Bottom tab bar (`#121316`, top border `#26282E`, height 64, active = `#60A5FA`, inactive = `#9A9DA6`, labels Poppins Medium 11):

| Tab | Icon | Screen |
|---|---|---|
| Home | `home` | Dashboard |
| History | `list` | All transactions |
| **Add** | `add` | Center tab: **blue rounded-square button (52px, white plus)** that opens the Add options sheet |
| Bills | `flash` | Bill Analyzer |
| Goals | `trophy` | Goals + Budgets |

**Add options sheet** (when the center + is tapped): a dark bottom sheet with a handle and four large tiles in a 2x2 grid: Manual entry, Paste SMS, Urdu quick entry, Can I afford it. Each tile has an icon, a title and a one-line description. Tiles rise in one after another (60ms apart).

---

## 8. Screens

**Shared look (all screens):** cards with a 1px border and 18px radius, `SectionHeader` titles, entrance fade and slide once (80ms apart), spring press with haptics, skeletons while loading, `EmptyState` for empty lists. Inputs are `cardRaised` with a blue focus border. Results use a large verdict card: blue (good), amber (careful), red (overbilled or not now). The scam alert is a red card that shakes once, lists the reasons, and offers Report to PTA (red) and Warn my family (outline). Nothing pulses or loops on it.

> Example text below is sometimes written in Roman Urdu to show the tone. In the app, every string comes from the translation files: proper English in English mode, Urdu script in Urdu mode (section 10).

### 8.1 Welcome (once, after the first login or sign up)
Swipeable screens with dots, "Next" and "Skip". Large Ionicons in soft blue circles.
1. Choose your language: two large cards, "English" and "اردو". Changing it restarts the app and continues at screen 2.
2. "Your money, tracked and protected" with three short lines: paste an SMS, speak in Urdu, check your electricity bill.
3. Monthly income (can be skipped): saved as this month's salary.
4. "Start fresh" or "Try with sample data".

Shown only if the user has not finished it and has no transactions. Settings can show it again.

### 8.2 Login / Sign up
- App name (large) and the tagline "Hisaab bhi, hifazat bhi" (muted).
- Email and password inputs, show/hide password icon. Sign up also asks for the name.
- Blue button "Login" / "Create account", text button to switch.
- Errors are shown under the input in plain words.

### 8.3 Home (Dashboard)
Top to bottom, sections fade and slide up once (80ms apart). Skeletons while loading, pull to refresh. Nothing loops or pulses.
- **Header:** greeting by time of day (small, muted) with the name (large); notifications icon (there are no notifications yet; it says so); avatar circle with the initial (opens Settings).
- **Hero card:** "Balance this month" with a count-up amount, the Health Score ring at the end (white, number and band inside), a divider, then Income | Spent.
- **Four tiles:** Paste SMS, Speak, Check bill, Afford?
- **Budget warning** (amber, with speaker): only when a budget is at 80% or more.
- **Spending this month:** top 3 categories with amounts and blue bars; "Details" opens the donut chart; health tip and insight with a speaker.
- **Recent:** rounded-square icon, title, "Today · SMS / Voice / Manual", amount at the end; "See all".

**Health Score (0–100):** start 50; +20 saved more than 10% of income; +15 every budget within limit; +15 spending below income; -20 any budget over 100%; capped at 45 when spending exceeds income.

### 8.4 Add Transaction (manual)
- Expense / Income segmented control, large amount field with "Rs".
- Category chips and payment type chips (selected chip is blue).
- Date (today by default) and an optional note.
- "Save" button at the bottom.

### 8.5 SMS Auto-entry
- "Paste SMS": helper line, multiline input, "Paste" button (clipboard), "Analyze with AI".
- **Normal SMS:** an editable transaction card (amount, category, payment type, merchant, date) with "Save".
- **Scam SMS:** the red scam card: shield icon, title, reasons as a list, "never share your PIN or OTP". Buttons: report to PTA 0800-55055, warn my family (share sheet), delete message.
- **Server unreachable:** the phone checks the message itself. With two or more red flags it shows the scam card marked "Checked on your phone (offline)"; otherwise it asks the user to try again.

### 8.6 Urdu Quick Entry (type or speak)
- Input, a hint to use the keyboard microphone, three example chips.
- "Add with AI" shows the entries as editable cards with checkboxes, then saves the checked ones together.

### 8.7 History
- Filter bar with chips: month, category, payment type.
- Transactions grouped by day, one card per day, with sticky day headers.
- Each row: category icon, title, payment type and time, amount.
- Swipe to delete, pull to refresh, empty states.

### 8.8 Bills (Bill Analyzer)
- "Check my bill" button, a units-per-month bar chart (two or more months), saved bills with a verdict chip.
- Form: month, previous and current reading, units billed, total amount; optional last month units, same month last year and company.
- Result: large verdict card, numbers in a grid, issues with colored dots, explanation with speaker, tips, and (if likely overbilled) a complaint with copy and share. Saving can also add a "Bills" expense.

### 8.9 Goals + Budgets
- Segmented control: **Budgets | Goals**.
- **Budgets:** one card per category with a bar: blue under 80%, amber 80 to 100%, red over.
- **Goals:** name, saved of target, progress bar, optional target date with a weekly saving suggestion, "Add money". A reached goal turns gold.

### 8.10 Can I Afford It?
- Item and price (up to Rs 100,000,000).
- Verdict card (blue yes, amber careful, red not now), money numbers, explanation with speaker, suggestion and weekly saving plan, Health Score now and after buying.

---

## 9. Writing style (UI text)

- **English mode:** short, plain labels: "Save", "Add money", "See all". Friendly tone: "Great job! Goal reached", "Your food budget is almost used up".
- **Urdu mode:** proper Urdu script, simple everyday words (not formal/official Urdu): "محفوظ کریں"، "رقم شامل کریں"، "سب دیکھیں". Friendly tone: "شاباش! ہدف پورا ہو گیا".
- AI replies come back in the user's chosen language: English, or Urdu script.
- No emojis in any text, including AI replies. Every AI prompt in the backend (Groq, with Z.ai GLM as backup) says: "Do not use emojis."
- Never blame the user. "A bit more went on food this month" / "اس مہینے کھانے پر تھوڑا زیادہ خرچ ہوا" — not "You overspent".

## 10. Languages: English and Urdu

The app has two complete languages, switched in **Settings → Language**. The choice applies everywhere at once.

### How to build it

- **Library:** `i18next` + `react-i18next`. Every piece of UI text comes from a translation file, never typed into a screen. Files: `mobile/i18n/en.json` and `mobile/i18n/ur.json`, with the same keys (for example `home.balanceThisMonth`).
- **Saving the choice:** `language` (`en` / `ur`) is stored in AsyncStorage (loads at app start) and in the user's Firestore profile.
- **First launch:** Urdu if the phone is set to Urdu, otherwise English. The welcome flow lets the user choose.
- **Right-to-left in Urdu mode:** the layout mirrors; styles use start and end, not left and right; arrows and chevrons point the other way. Changing direction restarts the app with `expo-updates` `reloadAsync()`, or asks the user to reopen it.
- **Things that do NOT mirror:** numbers and amounts, phone numbers, the bar chart's month order.
- **Money in Urdu mode:** `42,350 روپے` (Western digits).
- **Translations:** keep the words simple and everyday, and have a fluent Urdu reader check them.
- **AI replies:** every AI request carries `lang` (`en` or `ur`). Read aloud uses `ur-PK` or `en-US`, and says so if the phone has no Urdu voice.
- **Input stays flexible:** Quick Entry and SMS accept Urdu script, Roman Urdu or English.

### Settings screen

Opened from the avatar on Home. Grouped cards:
1. **Language:** two large cards, "English" and "اردو", with a note that the whole app, including AI replies, will switch.
2. **Voice:** "Read aloud" switch.
3. **Account:** email.
4. **About:** app name, version, scam help (PTA 0800-55055).
5. Small actions: "Load demo data" and "Show welcome again".
6. **Log out** (red text button).

## 11. Quality checklist for every screen

- [ ] Uses theme colors, and Poppins or Noto Nastaliq Urdu only (no system fonts)
- [ ] Has a loading state, an empty state, and an error state
- [ ] Primary button is obvious and reachable with the thumb
- [ ] Amounts formatted `Rs 12,500`, income light blue, expense primary text
- [ ] Tested on a real Android phone (small screen too)
- [ ] Checked in **both** English and Urdu mode: no hard-coded text, layout mirrored correctly, no Urdu text clipped
- [ ] No text cut off; Urdu text right-aligned with enough line height
