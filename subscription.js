// ════════════════════════════════════════════════════════════════
//  CNCdok — SUBSCRIPTION GATE  (Trial / Premium / Free)
//  Samostatný modul. Napája sa na appku cez vlastný Firebase import.
//  Vkladá sa do app.html jediným riadkom:
//      <script type="module" src="subscription.js"></script>
//
//  UX:
//    • hore slim pruh so stavom (Skúšobná X dní / Premium / Free)
//    • vo Free režime sa sekcie zamknú (🔒) a nedajú rozbaliť
//    • po prihlásení s ?checkout=monthly|yearly → presmeruje na Stripe
//      s client_reference_id = uid (aby webhook vedel komu zapnúť premium)
//
//  POZOR: toto je len UI vrstva. Reálne vynútenie musí byť vo
//  Firestore Security Rules + Stripe webhooku (pozri firestore.rules
//  a functions/). Bez nich sa zámok dá obísť cez DevTools.
// ════════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp }
    from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot }
    from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// ── Rovnaký Firebase projekt ako v app.html ──
const firebaseConfig = {
    apiKey: "AIzaSyAYEcK2dUUnERC0X6QtFnUcdgCpVNbVBwQ",
    authDomain: "cncdoc-827bf.firebaseapp.com",
    projectId: "cncdoc-827bf",
    storageBucket: "cncdoc-827bf.firebasestorage.app",
    messagingSenderId: "27352328550",
    appId: "1:27352328550:web:3d8d13f3e1230744d900a7"
};

const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ════════════════════════════════════════════════════════════════
//  NASTAVENIA
// ════════════════════════════════════════════════════════════════
const TRIAL_DAYS = 30;        // dĺžka skúšobnej doby pre nových
const DAY_MS     = 86400000;

// Stripe Payment Links — jeden link pre každý tarif a obdobie.
// Firma linky sú tvoje pôvodné (10 €/mes, 100 €/rok).
// Solo linky VYTVOR v Stripe (1 €/mes, 10 €/rok) a vlož sem.
// Pre OSTRÚ prevádzku vymeň test_ linky za live linky.
const CHECKOUT_LINKS = {
    firma_monthly: "https://buy.stripe.com/test_14AcN6ed5fTl9zFdYC3Je00",
    firma_yearly:  "https://buy.stripe.com/test_28E9AU8SL6iL5jpdYC3Je01",
    solo_monthly:  "TODO_STRIPE_LINK_SOLO_MESACNE",   // ← vlož Payment Link 1 €/mes
    solo_yearly:   "TODO_STRIPE_LINK_SOLO_ROCNE",      // ← vlož Payment Link 10 €/rok
};
// Kam smeruje "Aktivovať" v appke (nech si používateľ vyberie plán).
const UPGRADE_URL = "index.html#cennik";

// Sekcie, ktoré sa vo Free režime zamknú. Prázdne pole = zamkni všetky .section.
const LOCK_SELECTOR = ".section";

let subUnsub = null;     // odhlásenie realtime listenera
let checkoutHandled = false; // ?checkout= spracuj len raz

// ════════════════════════════════════════════════════════════════
//  ČISTÁ LOGIKA (bez DOM / Firebase) — testovateľná
// ════════════════════════════════════════════════════════════════
function evaluateMode(data) {
    const sub = (data && data.subscription) || {};

    // 1) Aktívne predplatné → Premium
    //    (ak je daný aj currentPeriodEnd, musí byť v budúcnosti)
    if (sub.active === true) {
        if (sub.currentPeriodEnd) {
            const pe = new Date(sub.currentPeriodEnd);
            if (!isNaN(pe) && Date.now() >= pe.getTime()) {
                return { mode: "free" }; // expirované, webhook to mal vypnúť
            }
        }
        return { mode: "premium" };
    }

    // 2) Beží ešte trial? → Trial
    if (sub.trialEndsAt) {
        const end = new Date(sub.trialEndsAt);
        if (!isNaN(end) && Date.now() < end.getTime()) {
            const daysLeft = Math.max(1, Math.ceil((end.getTime() - Date.now()) / DAY_MS));
            return { mode: "trial", daysLeft };
        }
    }

    // 3) Inak → Free (zamknúť)
    return { mode: "free" };
}

function dayWord(n) {
    if (n === 1) return "deň";
    if (n >= 2 && n <= 4) return "dni";
    return "dní";
}

function buildCheckoutUrl(plan, uid, email) {
    const base = CHECKOUT_LINKS[plan];
    if (!base) return null;
    const p = new URLSearchParams();
    if (uid)   p.set("client_reference_id", uid);
    if (email) p.set("prefilled_email", email);
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
}

// ════════════════════════════════════════════════════════════════
//  TRIAL PRE NOVÉHO POUŽÍVATEĽA (klientský fallback)
//  V ostrej prevádzke trial zakladá Cloud Function (onCreate) a toto
//  ticho zlyhá (Rules nepovolia klientovi zapisovať subscription).
// ════════════════════════════════════════════════════════════════
async function ensureTrial(user) {
    const ref = doc(db, "users", user.uid);
    let snap;
    try {
        snap = await getDoc(ref);
    } catch (e) {
        return; // offline/chyba – gate sa rozhodne podľa cache
    }

    const hasSub = snap.exists() && snap.data().subscription;
    if (hasSub) return; // už má subscription – nič nerob

    const end = new Date(Date.now() + TRIAL_DAYS * DAY_MS);
    try {
        await setDoc(ref, {
            email: user.email || null,
            subscription: {
                active: false,
                trialEndsAt: end.toISOString(),
                createdAt: new Date().toISOString()
            }
        }, { merge: true }); // merge = nepoškodí machines/drawings/tools
    } catch (e) {
        // V ostrej prevádzke je toto očakávané (Rules blokujú zápis subscription).
        console.warn("ensureTrial: klientský zápis trialu zlyhal (rieši Cloud Function):", e.message);
    }
}

// ════════════════════════════════════════════════════════════════
//  STATUS PRUH (hore pod topbarom)
// ════════════════════════════════════════════════════════════════
function ensureStatusStrip() {
    let strip = document.getElementById("sub-status");
    if (strip) return strip;

    injectStyles();
    strip = document.createElement("div");
    strip.id = "sub-status";
    strip.innerHTML = `
        <span class="sub-status-dot"></span>
        <span class="sub-status-text"></span>
        <button class="sub-status-cta" type="button">Aktivovať</button>`;
    const topbar = document.querySelector(".topbar");
    if (topbar) topbar.insertAdjacentElement("afterend", strip);
    else document.body.insertBefore(strip, document.body.firstChild);

    strip.querySelector(".sub-status-cta")
         .addEventListener("click", openUpgrade);
    return strip;
}

function setStatus(state, text, ctaLabel) {
    const strip = ensureStatusStrip();
    strip.className = "visible " + state;     // state: loading|trial|premium|free
    strip.querySelector(".sub-status-text").textContent = text;
    const cta = strip.querySelector(".sub-status-cta");
    if (ctaLabel) { cta.style.display = ""; cta.textContent = ctaLabel; }
    else cta.style.display = "none";
}

function hideStatus() {
    const strip = document.getElementById("sub-status");
    if (strip) strip.className = "";
}

// ════════════════════════════════════════════════════════════════
//  ZAMYKANIE SEKCIÍ (Free režim)
// ════════════════════════════════════════════════════════════════
function lockSections(locked) {
    injectStyles();
    document.querySelectorAll(LOCK_SELECTOR).forEach(sec => {
        if (locked) {
            sec.classList.add("sub-locked");
            sec.classList.remove("open");           // zbaľ, nech nevidno obsah
            const ch = sec.querySelector(".chevron");
            if (ch) ch.textContent = "🔒";
        } else {
            sec.classList.remove("sub-locked");
            const ch = sec.querySelector(".chevron");
            if (ch) ch.textContent = "⌄";
        }
    });
}

// Jeden capture-phase listener zachytí klik skôr, ako sa spustí
// inline onclick="toggleSection(...)" na hlavičke sekcie.
let lockGuardInstalled = false;
function installLockGuard() {
    if (lockGuardInstalled) return;
    lockGuardInstalled = true;
    document.addEventListener("click", (e) => {
        const head = e.target.closest(".section-head");
        if (!head) return;
        const sec = head.closest(LOCK_SELECTOR);
        if (sec && sec.classList.contains("sub-locked")) {
            e.preventDefault();
            e.stopImmediatePropagation();
            openUpgrade();
        }
    }, true); // capture
}

// ════════════════════════════════════════════════════════════════
//  UPGRADE MODAL
// ════════════════════════════════════════════════════════════════
function ensureUpgradeModal() {
    if (document.getElementById("sub-upgrade")) return;
    injectStyles();

    const el = document.createElement("div");
    el.id = "sub-upgrade";
    el.innerHTML = `
        <div class="sub-up-card">
            <button class="sub-up-x" type="button" aria-label="Zavrieť">✕</button>
            <div class="sub-up-logo">CNC<span>dok</span></div>
            <h2 class="sub-up-title">Aktivujte predplatné</h2>
            <p class="sub-up-text">
                Skúšobná doba sa skončila. Pre ďalší prístup k výkresom,
                strojom a nástrojom si vyberte plán.
            </p>
            <button class="sub-up-btn" data-goto="cennik">Vybrať plán</button>
            <button class="sub-up-signout" type="button">Odhlásiť sa</button>
            <p class="sub-up-note">Po zaplatení sa prístup odomkne automaticky.</p>
        </div>`;
    document.body.appendChild(el);

    el.addEventListener("click", (e) => { if (e.target === el) closeUpgrade(); });
    el.querySelector(".sub-up-x").addEventListener("click", closeUpgrade);
    el.querySelector('[data-goto="cennik"]')
      .addEventListener("click", () => { window.location.href = UPGRADE_URL; });
    el.querySelector(".sub-up-signout").addEventListener("click", () => {
        if (typeof window.signOut === "function") window.signOut();
        else auth.signOut();
    });
}

function openUpgrade()  { ensureUpgradeModal(); document.getElementById("sub-upgrade").classList.add("visible"); }
function closeUpgrade() { const m = document.getElementById("sub-upgrade"); if (m) m.classList.remove("visible"); }

function startCheckout(plan) {
    const user = auth.currentUser;
    if (!user) { window.location.href = "app.html?checkout=" + encodeURIComponent(plan); return; }
    const url = buildCheckoutUrl(plan, user.uid, user.email);
    if (url) window.location.href = url;
    else window.location.href = UPGRADE_URL;
}

// ════════════════════════════════════════════════════════════════
//  APLIKOVANIE STAVU
// ════════════════════════════════════════════════════════════════
function applyMode(result) {
    if (result.mode === "premium") {
        setStatus("premium", "★ Premium účet");
        lockSections(false);
        closeUpgrade();
    } else if (result.mode === "trial") {
        const n = result.daysLeft;
        setStatus("trial", `⏳ Skúšobná verzia · ostáva ${n} ${dayWord(n)}`);
        lockSections(false);
        closeUpgrade();
    } else { // free
        setStatus("free", "🔒 Free — prístup uzamknutý", "Aktivovať");
        lockSections(true);
    }
}

// ════════════════════════════════════════════════════════════════
//  HLAVNÝ TOK
// ════════════════════════════════════════════════════════════════
installLockGuard();

onAuthStateChanged(auth, async (user) => {
    if (subUnsub) { subUnsub(); subUnsub = null; }

    if (!user) {
        hideStatus();
        lockSections(false);
        closeUpgrade();
        return;
    }

    // 0) Deep-link z index.html: ?checkout=monthly|yearly → rovno na Stripe
    if (!checkoutHandled) {
        checkoutHandled = true;
        const plan = new URLSearchParams(window.location.search).get("checkout");
        if (plan && CHECKOUT_LINKS[plan]) {
            const url = buildCheckoutUrl(plan, user.uid, user.email);
            if (url) { window.location.replace(url); return; }
        }
    }

    setStatus("loading", "Načítavam predplatné…");

    // 1) zaisti trial pre nového používateľa (best-effort)
    await ensureTrial(user);

    // 2) realtime sledovanie – reaguje aj na zmenu z webhooku
    const ref = doc(db, "users", user.uid);
    subUnsub = onSnapshot(ref, (snap) => {
        applyMode(evaluateMode(snap.exists() ? snap.data() : {}));
    }, (err) => {
        // pri chybe radšej neblokuj (napr. offline) – ale ani netvrď premium
        console.warn("subscription listener error:", err.message);
        lockSections(false);
    });
});

// ════════════════════════════════════════════════════════════════
//  ŠTÝLY (vložia sa raz)
// ════════════════════════════════════════════════════════════════
function injectStyles() {
    if (document.getElementById("sub-gate-styles")) return;
    const css = document.createElement("style");
    css.id = "sub-gate-styles";
    css.textContent = `
    /* ── STATUS PRUH ── */
    #sub-status {
        display: none; align-items: center; gap: 8px;
        padding: 7px 14px; font-size: 13px; font-weight: 600;
        border-bottom: 1px solid var(--border, rgba(255,255,255,.08));
        position: sticky; top: 54px; z-index: 90;
    }
    #sub-status.visible { display: flex; }
    .sub-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .sub-status-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sub-status-cta {
        background: #ff6a2b; color: #fff; border: none; border-radius: 8px;
        padding: 5px 12px; font-size: 12px; font-weight: 800; cursor: pointer; flex-shrink: 0;
    }
    .sub-status-cta:active { transform: scale(.97); }

    #sub-status.loading { background: #141c28; color: #64748b; }
    #sub-status.loading .sub-status-dot { background: #64748b; }

    #sub-status.trial { background: #1a1405; color: #ffb547; }
    #sub-status.trial .sub-status-dot { background: #ffb547; }

    #sub-status.premium { background: #06140d; color: #34d399; }
    #sub-status.premium .sub-status-dot { background: #34d399; }

    #sub-status.free { background: #1a0b0b; color: #f87171; }
    #sub-status.free .sub-status-dot { background: #f87171; }

    /* ── ZAMKNUTÁ SEKCIA ── */
    .section.sub-locked { position: relative; opacity: .85; }
    .section.sub-locked .section-head { cursor: not-allowed; }
    .section.sub-locked .section-body { display: none !important; }
    .section.sub-locked .section-title::after {
        content: " 🔒"; font-size: 13px; opacity: .8;
    }
    .section.sub-locked .chevron { opacity: .9; }

    /* ── UPGRADE MODAL ── */
    #sub-upgrade {
        position: fixed; inset: 0; z-index: 9600;
        background: rgba(8,10,14,.92); backdrop-filter: blur(6px);
        display: none; align-items: center; justify-content: center; padding: 24px;
    }
    #sub-upgrade.visible { display: flex; }
    .sub-up-card {
        position: relative; background: #11151d; border: 1px solid #232a36;
        border-radius: 18px; max-width: 360px; width: 100%; padding: 30px 24px 24px;
        text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,.5);
    }
    .sub-up-x {
        position: absolute; top: 12px; right: 12px; width: 30px; height: 30px;
        border-radius: 50%; border: none; background: #1b2230; color: #6b7585;
        font-size: 15px; cursor: pointer;
    }
    .sub-up-logo { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 14px; }
    .sub-up-logo span { color: #ff6a2b; }
    .sub-up-title { color: #fff; font-size: 20px; margin: 0 0 8px; }
    .sub-up-text { color: #9aa4b2; font-size: 14px; line-height: 1.5; margin: 0 0 20px; }
    .sub-up-btn {
        display: block; width: 100%; background: #ff6a2b; color: #fff; border: none;
        padding: 13px; border-radius: 12px; font-weight: 800; font-size: 15px;
        margin-bottom: 10px; cursor: pointer; transition: background .2s;
    }
    .sub-up-btn span { display: block; font-weight: 500; font-size: 12px; opacity: .9; margin-top: 2px; }
    .sub-up-btn:active { background: #e85a1f; }
    .sub-up-btn.ghost { background: transparent; border: 1px solid #2a3342; color: #cbd5e1; }
    .sub-up-btn.ghost:active { background: #1b2230; }
    .sub-up-signout {
        background: none; border: none; color: #6b7585; font-size: 13px;
        cursor: pointer; padding: 8px; margin-top: 4px;
    }
    .sub-up-note { color: #5a6472; font-size: 12px; margin: 10px 0 0; }
    `;
    document.head.appendChild(css);
}

// ── Export čistej logiky pre testy (v prehliadači sa ignoruje) ──
if (typeof module !== "undefined" && module.exports) {
    module.exports = { evaluateMode, dayWord, buildCheckoutUrl, TRIAL_DAYS, DAY_MS, CHECKOUT_LINKS };
}
