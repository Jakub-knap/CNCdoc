// ════════════════════════════════════════════════════════════════
//  CNCdok — Cloud Functions
//  1) createTrialOnSignup  – pri registrácii založí 30-dňový trial
//  2) stripeWebhook        – po platbe zapne/vypne subscription.active
//
//  Toto je JEDINÉ miesto, kde sa zapisuje pole `subscription`
//  (Admin SDK obchádza Security Rules). Klient ho meniť nesmie.
// ════════════════════════════════════════════════════════════════

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();

const TRIAL_DAYS = 30;
const DAY_MS = 86400000;

// Stripe kľúče nastav cez:
//   firebase functions:config:set stripe.secret="sk_test_..." stripe.webhook="whsec_..."
const stripe = Stripe(functions.config().stripe.secret);
const WEBHOOK_SECRET = functions.config().stripe.webhook;

// ── Mapovanie Stripe produktu (prod_...) → tarif (solo / firma) ────
const PRODUCT_TIER = {
    "prod_UnyBSRQhtpJsCs": "solo",   // Solo 1 €/mes
    "prod_UnyCCCcHrcxN7h": "solo",   // Solo 10 €/rok
    "prod_UndxuayUAcVp61": "firma",  // Firma 10 €/mes
    "prod_UndyUu2paKLbgO": "firma",  // Firma 100 €/rok
};
function tierForProduct(productId) {
    return PRODUCT_TIER[productId] || null;
}

// ── 1) TRIAL pri registrácii ──────────────────────────────────────
exports.createTrialOnSignup = functions.auth.user().onCreate(async (user) => {
    const end = new Date(Date.now() + TRIAL_DAYS * DAY_MS);
    await db.doc(`users/${user.uid}`).set({
        email: user.email || null,
        subscription: {
            active: false,
            trialEndsAt: end.toISOString(),
            createdAt: new Date().toISOString(),
        },
    }, { merge: true });
});

// ── pomocné: nájdi uid podľa Stripe customer id ────────────────────
async function uidForCustomer(customerId) {
    const snap = await db.doc(`customers/${customerId}`).get();
    return snap.exists ? snap.data().uid : null;
}

async function setSubscription(uid, patch) {
    if (!uid) return;
    const cur = (await db.doc(`users/${uid}`).get()).data() || {};
    await db.doc(`users/${uid}`).set({
        subscription: Object.assign({}, cur.subscription || {}, patch),
    }, { merge: true });
}

// ── 2) STRIPE WEBHOOK ──────────────────────────────────────────────
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody, req.headers["stripe-signature"], WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Neplatný podpis webhooku:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {

            // platba dokončená – Payment Link nesie client_reference_id = uid
            case "checkout.session.completed": {
                const s = event.data.object;
                const uid = s.client_reference_id;
                const customerId = s.customer;
                if (uid && customerId) {
                    // ulož mapovanie customer → uid pre ďalšie eventy
                    await db.doc(`customers/${customerId}`).set({ uid });
                }
                let periodEnd = null, plan = null, tier = null;
                if (s.subscription) {
                    const sub = await stripe.subscriptions.retrieve(s.subscription);
                    periodEnd = new Date(sub.current_period_end * 1000).toISOString();
                    const priceObj = sub.items?.data?.[0]?.price;
                    plan = priceObj?.recurring?.interval || null; // "month"/"year"
                    tier = tierForProduct(priceObj?.product);     // "solo"/"firma"
                }
                await setSubscription(uid, {
                    active: true,
                    plan,
                    tier,
                    stripeCustomerId: customerId,
                    currentPeriodEnd: periodEnd,
                });
                break;
            }

            // obnovenie / zmena predplatného (renewal, upgrade…)
            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const sub = event.data.object;
                const uid = await uidForCustomer(sub.customer);
                const active = sub.status === "active" || sub.status === "trialing";
                const priceObj = sub.items?.data?.[0]?.price;
                await setSubscription(uid, {
                    active,
                    currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
                    plan: priceObj?.recurring?.interval || null,
                    tier: tierForProduct(priceObj?.product),
                });
                break;
            }

            // zrušené alebo neúspešná platba → vypni prístup
            case "customer.subscription.deleted": {
                const sub = event.data.object;
                await setSubscription(await uidForCustomer(sub.customer), { active: false });
                break;
            }
            case "invoice.payment_failed": {
                const inv = event.data.object;
                await setSubscription(await uidForCustomer(inv.customer), { active: false });
                break;
            }
        }
        res.json({ received: true });
    } catch (err) {
        console.error("Chyba spracovania webhooku:", err);
        res.status(500).send("internal");
    }
});
