// ════════════════════════════════════════════════════════════════
//  CNCdok — SUBSCRIPTION GATE  (Trial / Free / Premium)
//  Samostatný modul. Napája sa na appku cez vlastný Firebase import.
//  Vkladá sa do app.html jediným riadkom:
//      <script type="module" src="subscription.js"></script>
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

// Ak už app.html inicializoval Firebase, použijeme existujúcu inštanciu,
// inak vytvoríme vlastnú (oboje ukazuje na ten istý projekt).
const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Nastavenia ──
const TRIAL_DAYS = 30;                 // dĺžka skúšobnej doby pre nových
const CHECKOUT_URL = "https://buy.stripe.com/test_xxxxxxxx"; // TODO: tvoj Stripe Payment Link
const DAY_MS = 86400000;

let subUnsub = null;   // odhlásenie realtime listenera

// ════════════════════════════════════════════════════════════════
//  VYHODNOTENIE MÓDU
// ════════════════════════════════════════════════════════════════
function evaluateMode(data) {
    const sub = (data && data.subscription) || {};

    // 1) Platí? → Premium
    if (sub.active === true) return { mode: "premium" };

    // 2) Beží ešte trial? → Trial
    if (sub.trialEndsAt) {
        const end = new Date(sub.trialEndsAt);
        if (!isNaN(end) && Date.now() < end.getTime()) {
            const daysLeft = Math.max(1, Math.ceil((end.getTime() - Date.now()) / DAY_MS));
            return { mode: "trial", daysLeft };
        }
    }

    // 3) Inak → Free (zablokovať)
    return { mode: "free" };
}

// ════════════════════════════════════════════════════════════════
//  TRIAL PRE NOVÉHO POUŽÍVATEĽA  (zapíše sa len raz)
// ════════════════════════════════════════════════════════════════
async function ensureTrial(user) {
    const ref = doc(db, "users", user.uid);
    let snap;
    try {
        snap = await getDoc(ref);
    } catch (e) {
        // offline alebo chyba – nenastavujeme nič, gate sa rozhodne podľa cache
        return;
    }

    const hasSub = snap.exists() && snap.data().subscription;
    if (hasSub) return; // už má subscription (trial alebo platbu) – nič nerob

    const end = new Date(Date.now() + TRIAL_DAYS * DAY_MS);
    try {
        await setDoc(ref, {
            email: user.email || null,
            subscription: {
                active: false,
                trialEndsAt: end.toISOString(),
                createdAt: new Date().toISOString()
            }
        }, { merge: true });   // merge = nepoškodí machines/drawings/tools
    } catch (e) {
        console.warn("ensureTrial: zápis trialu zlyhal", e.message);
    }
}

// ════════════════════════════════════════════════════════════════
//  UI:  blokovacia obrazovka + banner
// ════════════════════════════════════════════════════════════════
function ensureBlockScreen() {
    if (document.getElementById("sub-block-screen")) return;

    const el = document.createElement("div");
    el.id = "sub-block-screen";
    el.innerHTML = `
        <div class="sub-block-card">
            <div class="sub-block-logo">CNC<span>dok</span></div>
            <h2 class="sub-block-title">Predplatné vypršalo</h2>
            <p class="sub-block-text">
                Vaša skúšobná doba sa skončila alebo predplatné nie je aktívne.
                Pre ďalší prístup k výkresom, strojom a nástrojom si prosím
                aktivujte predplatné.
            </p>
            <a class="sub-block-btn" id="sub-block-pay" href="${CHECKOUT_URL}">
                Aktivovať predplatné
            </a>
            <button class="sub-block-signout" id="sub-block-signout">Odhlásiť sa</button>
            <p class="sub-block-note">Po zaplatení sa prístup obnoví automaticky.</p>
        </div>`;
    document.body.appendChild(el);

    // Odhlásenie – zavolá funkciu z app.html ak existuje
    el.querySelector("#sub-block-signout").addEventListener("click", () => {
        if (typeof window.signOut === "function") window.signOut();
        else auth.signOut();
    });

    injectStyles();
}

function ensureBanner() {
    let b = document.getElementById("sub-trial-banner");
    if (!b) {
        b = document.createElement("div");
        b.id = "sub-trial-banner";
        document.body.appendChild(b);
        injectStyles();
    }
    return b;
}

function showBlock() {
    ensureBlockScreen();
    document.getElementById("sub-block-screen").classList.add("visible");
    // skry hlavnú appku, nech sa nedá obísť
    const appScreen = document.getElementById("app-screen");
    if (appScreen) appScreen.style.filter = "blur(4px)";
    if (appScreen) appScreen.style.pointerEvents = "none";
}

function hideBlock() {
    const s = document.getElementById("sub-block-screen");
    if (s) s.classList.remove("visible");
    const appScreen = document.getElementById("app-screen");
    if (appScreen) { appScreen.style.filter = ""; appScreen.style.pointerEvents = ""; }
}

function showBanner(daysLeft) {
    const b = ensureBanner();
    b.textContent = `Skúšobná verzia · ostáva ${daysLeft} ${dayWord(daysLeft)}`;
    b.classList.add("visible");
}

function hideBanner() {
    const b = document.getElementById("sub-trial-banner");
    if (b) b.classList.remove("visible");
}

function dayWord(n) {
    if (n === 1) return "deň";
    if (n >= 2 && n <= 4) return "dni";
    return "dní";
}

// ════════════════════════════════════════════════════════════════
//  APLIKOVANIE STAVU
// ════════════════════════════════════════════════════════════════
function applyMode(result) {
    if (result.mode === "premium") {
        hideBlock();
        hideBanner();
    } else if (result.mode === "trial") {
        hideBlock();
        showBanner(result.daysLeft);
    } else { // free
        hideBanner();
        showBlock();
    }
}

// ════════════════════════════════════════════════════════════════
//  HLAVNÝ TOK
// ════════════════════════════════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
    // odhlás predchádzajúci listener
    if (subUnsub) { subUnsub(); subUnsub = null; }

    if (!user) {
        hideBlock();
        hideBanner();
        return;
    }

    // 1) zaisti trial pre nového používateľa
    await ensureTrial(user);

    // 2) realtime sledovanie stavu – reaguje aj na zmenu z webhooku
    const ref = doc(db, "users", user.uid);
    subUnsub = onSnapshot(ref, (snap) => {
        const result = evaluateMode(snap.exists() ? snap.data() : {});
        applyMode(result);
    }, (err) => {
        // pri chybe radšej nechaj appku bežať (neblokuj offline používateľa)
        console.warn("subscription listener error:", err.message);
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
    #sub-trial-banner {
        position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%);
        background: #1a1f2b; color: #ffb547; border: 1px solid #ffb54740;
        padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 600;
        z-index: 9000; box-shadow: 0 4px 16px rgba(0,0,0,.4);
        display: none; white-space: nowrap;
    }
    #sub-trial-banner.visible { display: block; }

    #sub-block-screen {
        position: fixed; inset: 0; z-index: 9500;
        background: rgba(8,10,14,.92); backdrop-filter: blur(6px);
        display: none; align-items: center; justify-content: center; padding: 24px;
    }
    #sub-block-screen.visible { display: flex; }
    .sub-block-card {
        background: #11151d; border: 1px solid #232a36; border-radius: 18px;
        max-width: 360px; width: 100%; padding: 32px 24px; text-align: center;
        box-shadow: 0 12px 40px rgba(0,0,0,.5);
    }
    .sub-block-logo { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 18px; }
    .sub-block-logo span { color: #ff6a2b; }
    .sub-block-title { color: #fff; font-size: 20px; margin: 0 0 10px; }
    .sub-block-text { color: #9aa4b2; font-size: 14px; line-height: 1.5; margin: 0 0 22px; }
    .sub-block-btn {
        display: block; background: #ff6a2b; color: #fff; text-decoration: none;
        padding: 14px; border-radius: 12px; font-weight: 700; font-size: 15px;
        margin-bottom: 12px; transition: background .2s;
    }
    .sub-block-btn:active { background: #e85a1f; }
    .sub-block-signout {
        background: none; border: none; color: #6b7585; font-size: 13px;
        cursor: pointer; padding: 6px;
    }
    .sub-block-note { color: #5a6472; font-size: 12px; margin: 14px 0 0; }
    `;
    document.head.appendChild(css);
}
