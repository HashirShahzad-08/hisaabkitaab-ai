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
6. **No emojis anywhere in the UI.** Not in buttons, labels, alerts, AI replies or notifications. Meaning comes from real icons (Ionicons), color, custom illustrations and motion. Emojis make an app look cheap and auto-generated.
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

- **React Native Paper (Material 3)** with the custom theme above. Use Paper's `Card`, `Button`, `TextInput` (mode `outlined`), `Chip`, `FAB`, `Snackbar`, `Dialog`, `ProgressBar`, `SegmentedButtons`, `Searchbar`.
- **Icons:** `@expo/vector-icons` (Ionicons).
- **Charts:** `react-native-gifted-charts` (donut pie, bar, line) — always animated, rounded bar tops.
- **Animations:** `moti` (built on Reanimated).
- **Lottie:** `lottie-react-native`.
- **Haptics:** `expo-haptics`.
- **Gradient:** `expo-linear-gradient`.
- **Voice output (optional):** `expo-speech` with language `ur-PK`.

Build reusable components in `/app/components`: `AmountText`, `CategoryIcon`, `TransactionItem`, `StatCard`, `HealthScoreRing`, `GoalCard`, `AlertCard` (variants: danger / warning / success / info), `AIThinking` (skeleton shimmer), `EmptyState` (unDraw illustration + message + button), `PressableScale` (wrapper that adds the press-scale spring to anything).

---

## 6. Motion and feedback

| Moment | What happens |
|---|---|
| Screen opens | Cards fade in + slide up 12px, staggered 60ms each (Moti) |
| Home opens | Balance counts up from 0; Health Score ring fills from 0 (800ms) |
| Save transaction | Button morphs into an animated checkmark (Lottie), light haptic, then the screen slides back |
| Goal reached | Progress bar fills to the end, the card glows gold for a moment, trophy icon draws itself (Lottie), success haptic |
| Scam detected | Red `AlertCard` slides in and shakes once (Moti), shield-warning icon pulses, error haptic |
| Budget at 80% / 100% | Warning / danger `AlertCard` on Home |
| AI working | `AIThinking` shimmer card + text "AI soch raha hai…" (never a plain spinner) |
| Delete | Swipe left on a transaction → red delete action → confirm Dialog |
| Lists | Pull to refresh |

Durations: 200ms for taps, 300–400ms for screen elements, 800ms for the score ring. No animation longer than 1 second. Use **spring** animations (Moti `type: 'spring'`, damping ~15) for anything the finger touches, so it feels physical instead of robotic.

### Micro-interactions that make the app feel alive

| Element | Behavior |
|---|---|
| Every pressable card and button | Scales to 0.97 while pressed, springs back on release |
| Bottom tab icons | Active tab switches from outline to filled icon, bounces slightly (scale 1 → 1.15 → 1), a small blue pill slides under it |
| Center + button | Rotates 45° into an × while the Add sheet is open |
| Amounts | Roll to the new value (count animation) whenever they change, not only on first load |
| Charts | Donut segments sweep in clockwise; bars grow from the bottom one after another |
| Health Score ring | Fills smoothly; its color shifts from red → amber → blue → gold as the number rises (white on the Home hero card) |
| AI thinking | Shimmer sweeps across skeleton lines; the status text cycles every 1.5s: "SMS parh raha hai…" → "Hisaab laga raha hai…" → "Bas aik second…" |
| AI result | Result cards appear one by one (80ms stagger) with a soft fade + rise |
| Inputs | Border animates to `primary` on focus; errors slide in under the field with a single small shake |
| Transaction saved | New row slides into the top of the list with a brief `cardRaised` highlight that fades out |
| Pull to refresh | Blue spinner, light haptic when it triggers |

### Visual assets (no emojis)

- **Icons:** Ionicons only, outline style by default, filled style for active/selected states. One icon style across the whole app.
- **Illustrations** (onboarding, empty states): **unDraw** (undraw.co) — free, no attribution needed, and you can set the accent color to `#3B82F6` before downloading so every illustration matches the brand. Save as SVG/PNG in `/app/assets/illustrations/`.
- **Lottie animations** from **lottiefiles.com** (free). Pick **flat or line-style** animations only (no cartoon characters), and recolor them to the theme colors in the LottieFiles editor before downloading. Save the JSON in `/app/assets/lottie/`:

| File name | What it is | Search on LottieFiles |
|---|---|---|
| `check.json` | Checkmark that draws itself (save button, success) | "success check line" |
| `trophy.json` | Trophy that draws/shines (goal reached) | "trophy line" |
| `shield.json` | Shield with pulse (scam detected) | "security shield" |
| `scan.json` | Scanning line over a document (bill analysis) | "document scan" |
| `sound-wave.json` | Small equalizer bars (speaker playing) | "sound wave" |

Check each file's license allows free use, and list unDraw and the Lottie authors in the README credits.

## 7. Navigation

Bottom tab bar (`#121316`, top border `#26282E`, height 64, active = `#60A5FA`, inactive = `#9A9DA6`, labels Poppins Medium 11):

| Tab | Icon | Screen |
|---|---|---|
| Home | `home` | Dashboard |
| History | `list` | All transactions |
| **Add** | `add` | Center tab: **blue rounded-square button (52px, white plus)** that opens the Add options sheet |
| Bills | `flash` | Bill Analyzer |
| Goals | `trophy` | Goals + Budgets |

**Add options sheet** (bottom sheet when the center + is tapped), four big rows with icons:
1. Icon `create-outline` — **Manual entry** → Add Transaction form
2. Icon `chatbox-ellipses-outline` — **Paste SMS** → SMS auto-entry
3. Icon `mic-outline` — **Urdu quick entry (type or speak)** → Quick Entry
4. Icon `help-circle-outline` — **Kya main afford kar sakta hoon?** → Afford check

Each row: icon inside a 44px `cardRaised` circle, title (bodyMedium) + one-line caption, chevron on the right. Rows animate in one after another (40ms stagger) as the sheet springs up.

---

## 8. Screens

> Example text below is sometimes written in Roman Urdu to show the tone. In the app, every string comes from the translation files: proper English in English mode, Urdu script in Urdu mode (section 10).

### 8.1 Onboarding (3 slides, first launch only)
- Before the slides: a language choice screen with two big cards, "English" and "اردو". The slides then appear in the chosen language.
- Slide 1: unDraw illustration ("savings") — "Apna hisaab, asaan andaaz mein" / Track every rupee, easily.
- Slide 2: unDraw illustration ("secure data") — "Scam SMS aur ghalat bills se hifazat" / Protection from scam SMS and overbilling.
- Slide 3: unDraw illustration ("voice assistant") — "AI jo Urdu samjhe" / AI that understands Urdu.
- Dots indicator, "Skip" top right, "Get started" blue button on the last slide.

### 8.2 Login / Sign up
- App name "HisaabKitaab AI" (h1, primary) + tagline "Hisaab bhi, hifazat bhi" (caption).
- Email + password outlined inputs, show/hide password eye icon.
- Primary button "Login" / "Create account", text link to switch.
- Sign up also asks: name, monthly income (optional).
- Errors shown under the input in `danger`, in plain words ("Password must be at least 6 characters").

### 8.3 Home (Dashboard)
Top to bottom, sections fade and slide up once (80ms apart). Skeletons while loading, pull to refresh. Nothing loops or pulses.
- **Header:** greeting by time of day (small, muted) with the name (large); notifications icon; avatar circle with the initial (opens Settings).
- **Hero card:** "Balance this month" with a count-up amount, the Health Score ring at the end (white, number and band inside), a divider, then Income | Spent.
- **Four tiles:** Paste SMS, Speak, Check bill, Afford?
- **Budget warning** (amber, with speaker): only when a budget is at 80% or more.
- **Spending this month:** top 3 categories with amounts and blue bars; "Details" opens the donut chart; health tip and insight with a speaker.
- **Recent:** rounded-square icon, title, "Today · SMS / Voice / Manual", amount at the end; "See all".

**Health Score (0–100):** start 50; +20 saved more than 10% of income; +15 every budget within limit; +15 spending below income; -20 any budget over 100%; capped at 45 when spending exceeds income.

### 8.4 Add Transaction (manual)
- Expense / Income toggle (`SegmentedButtons`) at the top; amount field in **display** size, centered, with "Rs" prefix.
- Category: horizontal scroll of colored icon chips.
- Payment type: 4 chips.
- Date (default today, date picker), note (optional).
- Bottom "Save" button.

### 8.5 SMS Auto-entry
- Title "Paste SMS". Big multiline input with a "Paste" button (reads clipboard via `expo-clipboard`).
- Small helper: "JazzCash, Easypaisa ya bank ka SMS paste karein".
- Button "Analyze with AI" → `AIThinking` →
  - **Normal SMS:** a pre-filled transaction card (amount, category, payment type, merchant) with an "Edit" link and a "Save" button.
  - **Scam SMS:** red `AlertCard` that shakes once, with a pulsing `shield-half-outline` icon: **"Ye SMS fraud lagta hai"**, the reason in simple words, the BISP 8171 tip if relevant, and "Never share your PIN or OTP". Buttons: "Delete it" (dismiss) and "Report to PTA (0800-55055)".

### 8.6 Urdu Quick Entry (type or speak)
- Big input with placeholder: "aaj 800 ka petrol aur 300 ka doodh".
- Hint under it, with a `mic-outline` icon: "Keyboard ka mic dabayein aur Urdu mein bolein" (Urdu font for the Urdu version).
- 3 example chips the user can tap to fill the input.
- "Add with AI" → list of parsed entries as editable cards, each with a checkbox → "Save all (2)".

### 8.7 History
- Searchbar + filter chips row (This month / Category / Payment type).
- Transactions **grouped by day** with sticky headers ("Aaj", "Kal", "21 Nov").
- Each row: `CategoryIcon` · title + caption (payment type, time) · amount (light blue / primary text).
- Swipe left to delete; pull to refresh; `EmptyState` when nothing found.

### 8.8 Bills (Bill Analyzer)
- Top: list of saved bills as small cards (month, units, amount) + a small bar chart of units per month.
- "Analyze new bill" button → form: bill type (Electricity / Gas segmented), company (dropdown: IESCO, LESCO, K-Electric, MEPCO, FESCO, GEPCO, PESCO, HESCO, QESCO, SEPCO, SNGPL, SSGC), month, previous reading, current reading, units charged, total amount.
- Optional later: "Scan bill photo" button (`camera-outline` icon) above the form.
- Result screen as stacked cards:
  1. **Reading check:** `checkmark-circle` icon in blue "Units match your readings", or `alert-circle` icon in warning "Charged X units but readings show Y".
  2. **Comparison:** "+40% vs last month" with up/down arrow and color.
  3. **Bill explained:** short bullet explanation.
  4. **Bachat tips:** 2–3 tips with lightbulb icons.
  5. **Complaint draft:** collapsed card → expand to read → "Copy" button (only if a problem was found).
- Saving the bill also adds a "Bills" expense automatically (show a Snackbar).

### 8.9 Goals + Budgets
- Segmented control at top: **Goals | Budgets**.
- **Goals:** `GoalCard`s (gold progress bar, "Rs 32,000 / Rs 80,000", days left), "+ Add money" button on each; FAB "+ New goal". New goal sheet offers presets, each with an icon: Ramadan (`moon-outline`), Eid (`gift-outline`), School fees (`school-outline`), Laptop (`laptop-outline`), Custom (`create-outline`).
- **Budgets:** one row per category: icon, "Rs 6,400 / Rs 8,000", progress bar colored blue (<80%), warning (80–99%), danger (100%+).

### 8.10 Can I Afford It?
- Inputs: "Kya lena hai?" (item) + price.
- "Ask AI" → result card with a big verdict badge with icon: `checkmark-circle` **Haan** (blue) / `alert-circle` **Soch samajh ke** (warning) / `close-circle` **Abhi nahi** (danger); the badge scales in with a spring, the reason (1–2 lines), and a suggestion ("Agar 3 mahine Rs 5,000 bachayein to aaram se le sakte hain"). Speaker icon button to hear it.

---

## 9. Writing style (UI text)

- **English mode:** short, plain labels: "Save", "Add money", "See all". Friendly tone: "Great job! Goal reached", "Your food budget is almost used up".
- **Urdu mode:** proper Urdu script, simple everyday words (not formal/official Urdu): "محفوظ کریں"، "رقم شامل کریں"، "سب دیکھیں". Friendly tone: "شاباش! ہدف پورا ہو گیا".
- AI replies come back in the user's chosen language: English, or Urdu script.
- No emojis in any text, including AI replies. Every Gemini prompt in the backend must say: "Do not use emojis."
- Never blame the user. "A bit more went on food this month" / "اس مہینے کھانے پر تھوڑا زیادہ خرچ ہوا" — not "You overspent".

## 10. Languages: English and Urdu

The app has two complete languages, switched in **Settings → Language**. The choice applies everywhere at once.

### How to build it

- **Library:** `i18next` + `react-i18next`. Every piece of UI text comes from a translation file — never type text directly into a screen. Files: `/app/i18n/en.json` and `/app/i18n/ur.json`, with the same keys (for example `home.balanceThisMonth`).
- **Start on Day 1.** Even before the Urdu file is filled in, write every screen with `t('key')` from the beginning. Adding translations later to hard-coded text takes much longer.
- **Saving the choice:** store `language` (`en` / `ur`) in AsyncStorage (so it loads instantly on app start) and in the user's Firestore `profile`.
- **First launch:** onboarding slide 1 shows two big buttons, "English" and "اردو", so the user chooses right away. Default: English.
- **Right-to-left in Urdu mode:** the whole layout mirrors. Rows run right to left, back arrows point right, text is right-aligned, list item icons move to the right side, progress bars fill from the right. Use one `isRTL` value from the language setting and apply `direction: 'rtl'` on the root view, plus `textAlign: 'right'` on text. Charts and the tab bar order also mirror. Ask Claude Code which approach works best in Expo for switching without restarting the app; if a restart is needed, use `expo-updates` `reloadAsync()` after the user confirms.
- **Things that do NOT mirror:** numbers and amounts (`Rs 42,350` stays left-to-right inside the RTL layout), phone numbers, the bar chart's month order (still oldest to newest, but labels in Urdu month names).
- **Money in Urdu mode:** `42,350 روپے` (Western digits, which is what Pakistani users read on bills and SMS).
- **Translations:** ask Gemini or Claude to translate `en.json` into `ur.json`, then have a team member who reads Urdu well check every line. Keep the words simple and everyday.
- **AI replies:** every backend route takes a `lang` field (`en` or `ur`) and the prompt says "Reply in English" or "Reply in simple Urdu script". The Urdu voice button uses `expo-speech` with `ur-PK`; in English mode it uses `en-US`.
- **Input stays flexible:** in both modes, Quick Entry and SMS accept Urdu script, Roman Urdu or English. Only the app's own text changes language.

### Settings screen

Reached from the bell/profile area on Home (a gear icon). Sections:
1. **Profile:** name, monthly income.
2. **Language:** two large selectable cards, "English" and "اردو", the selected one with a blue border and check icon. A note under it: "The whole app, including AI replies, will switch."
3. **Notifications:** bill due reminders, budget alerts (switches).
4. **About:** app version, team Hawk AI, credits.
5. **Log out** (danger-colored text button).

In Urdu mode the Settings screen itself is fully in Urdu and mirrored.

## 11. Quality checklist for every screen

- [ ] Uses theme colors and Poppins only (no default blue, no system fonts)
- [ ] Has a loading state, an empty state, and an error state
- [ ] Primary button is obvious and reachable with the thumb
- [ ] Amounts formatted `Rs 12,500`, income light blue, expense primary text
- [ ] Tested on a real Android phone (small screen too)
- [ ] Checked in **both** English and Urdu mode: no hard-coded text, layout mirrored correctly, no Urdu text clipped
- [ ] No text cut off; Urdu text right-aligned with enough line height
