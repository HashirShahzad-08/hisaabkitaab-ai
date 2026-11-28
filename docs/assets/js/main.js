// ---------------------------------------------------------------
// SETTINGS: change these if you need to
// ---------------------------------------------------------------
const APK_FILE = "https://github.com/HashirShahzad-08/hisaabkitaab-ai/releases/latest/download/hisaabkitaab-ai.apk";
const APP_VERSION = "1.0.0";
// ---------------------------------------------------------------

document.getElementById("apk-version").textContent = "Version " + APP_VERSION;

// QR code that points to the APK (so judges can scan it from the laptop screen)
const apkUrl = new URL(APK_FILE, window.location.href).href;
const qr = document.getElementById("qr");
qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=264x264&margin=0&data=" + encodeURIComponent(apkUrl);
qr.onerror = () => { document.getElementById("qr-box").style.display = "none"; };

// iPhone visitors: show an "Android only" note
if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) document.body.classList.add("ios");

// Sticky download bar on phones: show it once the main button scrolls away
const mbar = document.getElementById("mbar");
const heroBtn = document.getElementById("apk-link");
new IntersectionObserver(([e]) => mbar.classList.toggle("show", !e.isIntersecting && window.scrollY > 200))
  .observe(heroBtn);

// Swipe dots for the feature cards on phones
const grid = document.querySelector(".grid");
const dots = document.querySelectorAll("#dots i");
const setDot = () => {
  const cards = grid.children; let best = 0, dist = 1e9;
  const mid = grid.scrollLeft + grid.clientWidth / 2;
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i].offsetLeft + cards[i].clientWidth / 2;
    if (Math.abs(c - mid) < dist) { dist = Math.abs(c - mid); best = i; }
  }
  dots.forEach((d, i) => d.classList.toggle("on", i === best));
};
grid.addEventListener("scroll", setDot, { passive: true }); setDot();

// Phone screenshot slideshow in the hero
const slides = document.querySelectorAll(".slide");
let cur = 0;
setInterval(() => {
  slides[cur].classList.remove("active");
  cur = (cur + 1) % slides.length;
  slides[cur].classList.add("active");
}, 2600);

// Reveal sections as you scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll(".card, .steps li, .strip, .video-wrap, .final h2, .features h2, .install h2").forEach((el, i) => {
  el.classList.add("reveal");
  el.style.transitionDelay = (el.classList.contains("card") ? (i % 2) * 0.12 : 0) + "s";
  io.observe(el);
});

// Mobile menu
const menuBtn = document.getElementById("menu-btn");
const mnav = document.getElementById("mnav");
const setMenu = open => {
  document.body.classList.toggle("menu-open", open);
  menuBtn.setAttribute("aria-expanded", open); mnav.setAttribute("aria-hidden", !open);
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};
menuBtn.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
mnav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
