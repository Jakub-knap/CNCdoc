const Stripe = require('stripe');
const admin = require('firebase-admin');

let initError = null;

// Inicializácia Firebase Admin (len raz) — chránená proti pádu pri štarte
if (!admin.apps.length) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    initError = err;
    console.error('Firebase Admin init failed:', err.message);
  }
}

const db = initError ? null : admin.firestore();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) =>
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    );
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  if (initError) {
    console.error('Aborting: Firebase Admin failed to initialize:', initError.message);
    res.status(500).json({ error: 'firebase_init_failed', message: initError.message });
    return;
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET env var');
    res.status(500).json({ error: 'missing_webhook_secret' });
    return;
  }

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email =
          session.customer_details?.email || session.customer_email;
        if (email) {
          await setSubscriptionStatus(email, {
            active: true,
            customerId: session.customer,
            subscriptionId: session.subscription,
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const status = subscription.status; // active, trialing, canceled, past_due...
        const active = ['active', 'trialing'].includes(status);
        const plan =
          subscription.items?.data?.[0]?.price?.recurring?.interval || null; // 'month' alebo 'year'

        const customer = await stripe.customers.retrieve(
          subscription.customer
        );
        const email = customer.email;

        if (email) {
          await setSubscriptionStatus(email, {
            active,
            status,
            plan,
            customerId: subscription.customer,
            subscriptionId: subscription.id,
          });
        }
        break;
      }

      default:
        // Ostatné typy udalostí ignorujeme
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).send('Internal Server Error');
  }
}

// Dôležité: Stripe potrebuje surové (raw) telo požiadavky na overenie podpisu
handler.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = handler;

async function setSubscriptionStatus(email, data) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    await db.collection('users').doc(uid).set(
      {
        subscription: {
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    console.log(`Subscription updated for ${email} (uid: ${uid})`);
  } catch (err) {
    console.error(
      `Nepodarilo sa nájsť Firebase užívateľa pre email ${email}:`,
      err.message
    );
  }
}
