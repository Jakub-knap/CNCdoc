// ════════════════════════════════════════════════════════════════
//  CNCdok — PRENOS DÁT MEDZI ÚČTAMI (cez QR kód)
//  Vercel serverless funkcia: /api/transfer
//
//  Prijímač (napr. firemný tablet) vytvorí kód → zobrazí QR.
//  Odosielateľ (napr. súkromný mobil) naskenuje QR, vyberie stroje, odošle.
//  Prijímač potvrdí → server SKOPÍRUJE výkresy, nástroje aj fotky.
//  Dáta odosielateľa zostanú bez zmeny (kópia, nie presun).
//
//  Nikto nikomu nedáva heslo — každé zariadenie je prihlásené vlastným
//  účtom a server overuje oboch cez Firebase ID token.
//  Používa rovnakú premennú FIREBASE_SERVICE_ACCOUNT ako stripe-webhook.js.
// ════════════════════════════════════════════════════════════════
const admin = require('firebase-admin');
const crypto = require('crypto');

const BUCKET = 'cncdoc-827bf.firebasestorage.app';
const CODE_TTL_MS = 10 * 60 * 1000;        // kód platí 10 minút
const TOOL_CHUNK = 25;                      // koľko nástrojov na jedno volanie
const DRAW_CHUNK = 10;                      // koľko výkresov na jedno volanie
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bez 0/O, 1/I

let initError = null;
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), storageBucket: BUCKET });
  } catch (err) {
    initError = err;
    console.error('Firebase Admin init failed:', err.message);
  }
}
const db = initError ? null : admin.firestore();
const bucket = initError ? null : admin.storage().bucket(BUCKET);

// ── pomocné ──────────────────────────────────────────────────────
function newCode() {
  const bytes = crypto.randomBytes(6);
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return s;
}
const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

function fail(res, status, error, extra) { res.status(status).json({ error, ...(extra || {}) }); }

// Limity plánov — MUSIA sedieť s PLAN_LIMITS v app.html.
// Firma: výkresy sa počítajú NA JEDEN STROJ, ostatné spolu. Skúšobná verzia = limity Jednotlivca.
const LIMITS = {
  solo:  { machines: 1,  drawings: 100, tools: 60 },
  firma: { machines: 10, drawings: 150, tools: 90 },
};

// Stav účtu — rovnaké pravidlá ako evaluateMode() v subscription.js
function accountState(data) {
  const sub = (data && data.subscription) || {};
  const tier = sub.tier === 'firma' ? 'firma' : 'solo';
  if (sub.active === true) {
    const pe = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() : NaN;
    if (!sub.currentPeriodEnd || isNaN(pe) || Date.now() < pe) return { active: true, trial: false, tier };
  }
  if (sub.trialEndsAt) {
    const end = new Date(sub.trialEndsAt).getTime();
    if (!isNaN(end) && Date.now() < end) return { active: true, trial: true, tier };
  }
  return { active: false, trial: false, tier };
}
async function isActive(uid) {
  const u = await db.collection('users').doc(uid).get();
  return accountState(u.exists ? u.data() : {}).active;
}

const toolKey = (d) => [d.category, norm(d.diameter), norm(d.name)].join('|');

// Čo presne sa skopíruje + kontrola limitov prijímača. Volá sa pri odoslaní aj pri potvrdení.
async function planTransfer(senderUid, receiverUid, all, machines) {
  const sU = db.collection('users').doc(senderUid);
  const rU = db.collection('users').doc(receiverUid);
  const [sUser, sDraw, sTools, rUser, rDraw, rTools] = await Promise.all([
    sU.get(), sU.collection('drawings').get(), sU.collection('tools').get(),
    rU.get(), rU.collection('drawings').get(), rU.collection('tools').get(),
  ]);
  const rState = accountState(rUser.exists ? rUser.data() : {});
  if (!rState.active) return { error: 'receiver_inactive' };

  const selDrawings = sDraw.docs.filter(d => all || machines.includes(d.data().machine));
  const linked = new Set(selDrawings.flatMap(d => d.data().toolIds || []));
  const selTools = sTools.docs.filter(x => all || machines.includes(x.data().machine) || linked.has(x.id));

  // Výkres s číslom, ktoré prijímač už má, sa preskočí
  const rNumbers = new Set(rDraw.docs.map(d => d.data().number));
  const newDrawings = selDrawings.filter(d => !rNumbers.has(d.data().number));

  // Rovnaký nástroj už prijímač má → nevytvárať duplikát, len naň prepojiť
  const existing = {};
  rTools.docs.forEach(x => { existing[toolKey(x.data())] = x.id; });
  const idMap = {}; const toolQueue = []; let toolsReused = 0;
  selTools.forEach(x => {
    const k = toolKey(x.data());
    if (existing[k]) { idMap[x.id] = existing[k]; toolsReused++; } else toolQueue.push(x.id);
  });

  const senderMachines = (sUser.exists && sUser.data().machines) || [];
  const addMachines = [...new Set(all ? senderMachines : machines)];
  const rMachines = (rUser.exists && rUser.data().machines) || [];
  const newMachines = addMachines.filter(m => !rMachines.includes(m));

  // ── Limity prijímača ──
  const L = LIMITS[rState.tier];
  const plan = rState.trial ? 'trial' : rState.tier;
  let limit = null;
  if (newMachines.length && rMachines.length + newMachines.length > L.machines) {
    limit = { kind: 'machines', limit: L.machines, current: rMachines.length, incoming: newMachines.length };
  } else if (toolQueue.length && rTools.docs.length + toolQueue.length > L.tools) {
    limit = { kind: 'tools', limit: L.tools, current: rTools.docs.length, incoming: toolQueue.length };
  } else if (rState.tier === 'firma') {
    const cur = {}, inc = {};
    rDraw.docs.forEach(d => { const m = d.data().machine || ''; cur[m] = (cur[m] || 0) + 1; });
    newDrawings.forEach(d => { const m = d.data().machine || ''; inc[m] = (inc[m] || 0) + 1; });
    for (const m of Object.keys(inc)) {
      if ((cur[m] || 0) + inc[m] > L.drawings) {
        limit = { kind: 'drawings_machine', machine: m, limit: L.drawings, current: cur[m] || 0, incoming: inc[m] };
        break;
      }
    }
  } else if (newDrawings.length && rDraw.docs.length + newDrawings.length > L.drawings) {
    limit = { kind: 'drawings', limit: L.drawings, current: rDraw.docs.length, incoming: newDrawings.length };
  }
  if (limit) return { error: 'limit_exceeded', limit: { ...limit, plan } };

  return { selDrawings, selTools, newDrawings, idMap, toolQueue, toolsReused, addMachines };
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return {};
}

// Z URL Firebase Storage vytiahne cestu k súboru
function pathFromUrl(url) {
  try {
    const part = String(url).split('/o/')[1];
    if (!part) return null;
    return decodeURIComponent(part.split('?')[0]);
  } catch (e) { return null; }
}

// Skopíruje fotku z účtu odosielateľa do účtu prijímača.
// Vráti { url, path } novej kópie, alebo pôvodnú hodnotu, ak to nie je súbor odosielateľa.
async function copyPhoto(url, knownPath, senderUid, receiverUid, folder) {
  if (!url || String(url).startsWith('data:')) return { url, path: null };   // stará fotka uložená priamo v dokumente
  const srcPath = knownPath || pathFromUrl(url);
  if (!srcPath || !srcPath.startsWith(`users/${senderUid}/`)) return { url, path: knownPath || null };
  const name = srcPath.split('/').pop();
  const dstPath = `users/${receiverUid}/${folder}/${Date.now()}_${crypto.randomBytes(3).toString('hex')}_${name}`;
  await bucket.file(srcPath).copy(bucket.file(dstPath));
  const token = crypto.randomUUID();
  await bucket.file(dstPath).setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
  const newUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(dstPath)}?alt=media&token=${token}`;
  return { url: newUrl, path: dstPath };
}

// Spustí úlohy s obmedzeným počtom naraz (rýchlejšie ako jedna po druhej)
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  });
  await Promise.all(workers);
  return out;
}

async function userEmail(uid) {
  try { return (await admin.auth().getUser(uid)).email || ''; } catch (e) { return ''; }
}

// ── hlavná funkcia ───────────────────────────────────────────────
async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');
  if (initError) return fail(res, 500, 'firebase_init_failed');

  // Overenie prihláseného používateľa
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  let me;
  try { me = await admin.auth().verifyIdToken(idToken); }
  catch (e) { return fail(res, 401, 'not_signed_in'); }

  const body = await readJson(req);
  const action = body.action;
  const code = normCode(body.code);
  const tref = code ? db.collection('transfers').doc(code) : null;

  try {
    // 1) PRIJÍMAČ: vytvoriť nový kód
    if (action === 'create') {
      if (!(await isActive(me.uid))) return fail(res, 403, 'account_inactive');
      let c, exists = true;
      for (let tries = 0; tries < 5 && exists; tries++) {
        c = newCode();
        exists = (await db.collection('transfers').doc(c).get()).exists;
      }
      const now = Date.now();
      await db.collection('transfers').doc(c).set({
        status: 'waiting',
        receiverUid: me.uid,
        receiverEmail: me.email || await userEmail(me.uid),
        createdAt: now,
        expiresAt: now + CODE_TTL_MS,
      });
      return res.status(200).json({ code: c, expiresAt: now + CODE_TTL_MS });
    }

    if (!tref) return fail(res, 400, 'missing_code');
    const snap = await tref.get();
    if (!snap.exists) return fail(res, 404, 'code_not_found');
    const t = snap.data();
    const expired = Date.now() > t.expiresAt && (t.status === 'waiting' || t.status === 'sent');

    // 2) ODOSIELATEĽ: overiť kód (komu sa bude posielať)
    if (action === 'check') {
      if (expired) return fail(res, 410, 'code_expired');
      if (t.status !== 'waiting') return fail(res, 409, 'code_used');
      if (t.receiverUid === me.uid) return fail(res, 400, 'same_account');
      if (!(await isActive(me.uid))) return fail(res, 403, 'account_inactive');
      return res.status(200).json({ receiverEmail: t.receiverEmail });
    }

    // 3) ODOSIELATEĽ: odoslať výber (čo sa má skopírovať)
    if (action === 'send') {
      if (expired) return fail(res, 410, 'code_expired');
      if (t.status !== 'waiting') return fail(res, 409, 'code_used');
      if (t.receiverUid === me.uid) return fail(res, 400, 'same_account');
      const all = body.all === true;
      const machines = Array.isArray(body.machines) ? body.machines.map(String) : [];
      if (!all && !machines.length) return fail(res, 400, 'nothing_selected');
      if (!(await isActive(me.uid))) return fail(res, 403, 'account_inactive');

      const plan = await planTransfer(me.uid, t.receiverUid, all, machines);
      if (plan.error) return fail(res, 403, plan.error, plan.limit ? { limit: plan.limit } : null);
      const { selDrawings, selTools } = plan;
      if (!selDrawings.length && !selTools.length) return fail(res, 400, 'nothing_to_send');

      await tref.update({
        status: 'sent',
        senderUid: me.uid,
        senderEmail: me.email || await userEmail(me.uid),
        all, machines,
        summary: { drawings: selDrawings.length, tools: selTools.length, machines: all ? null : machines },
        sentAt: Date.now(),
      });
      return res.status(200).json({ ok: true, summary: { drawings: selDrawings.length, tools: selTools.length } });
    }

    // 4) OBE STRANY: stav prenosu (zariadenia sa pýtajú každé 2 sekundy)
    if (action === 'status') {
      if (me.uid !== t.receiverUid && me.uid !== t.senderUid) return fail(res, 403, 'forbidden');
      return res.status(200).json({
        status: expired ? 'expired' : t.status,
        senderEmail: t.senderEmail || null,
        receiverEmail: t.receiverEmail,
        summary: t.summary || null,
        progress: t.progress || null,
        stats: t.stats || null,
        expiresAt: t.expiresAt,
      });
    }

    // 5) PRIJÍMAČ: odmietnuť
    if (action === 'reject') {
      if (me.uid !== t.receiverUid) return fail(res, 403, 'forbidden');
      await tref.update({ status: 'rejected' });
      return res.status(200).json({ ok: true });
    }

    // 6) PRIJÍMAČ: potvrdiť — pripraví zoznam, čo sa skopíruje
    if (action === 'accept') {
      if (me.uid !== t.receiverUid) return fail(res, 403, 'forbidden');
      if (expired) return fail(res, 410, 'code_expired');
      if (t.status !== 'sent') return fail(res, 409, 'wrong_state');

      if (!(await isActive(t.senderUid))) return fail(res, 403, 'sender_inactive');
      const plan = await planTransfer(t.senderUid, t.receiverUid, t.all, t.machines || []);
      if (plan.error) return fail(res, 403, plan.error, plan.limit ? { limit: plan.limit } : null);
      const { selDrawings, selTools, newDrawings, idMap, toolQueue, toolsReused, addMachines } = plan;

      // Stroje: pridať do zoznamu prijímača tie, ktoré mu chýbajú
      if (addMachines.length) {
        await db.collection('users').doc(t.receiverUid)
          .set({ machines: admin.firestore.FieldValue.arrayUnion(...addMachines) }, { merge: true });
      }

      await tref.update({
        status: 'copying',
        idMap, toolQueue,
        drawQueue: newDrawings.map(d => d.id),
        toolPos: 0, drawPos: 0, lockUntil: 0,
        progress: { toolsDone: toolsReused, toolsTotal: selTools.length, drawingsDone: 0, drawingsTotal: newDrawings.length },
        stats: { drawingsCopied: 0, drawingsSkipped: selDrawings.length - newDrawings.length, toolsCopied: 0, toolsReused, photosCopied: 0 },
      });
      return res.status(200).json({ ok: true });
    }

    // 7) PRIJÍMAČ: skopírovať ďalšiu dávku (volá sa opakovane, kým nie je hotovo)
    if (action === 'step') {
      if (me.uid !== t.receiverUid) return fail(res, 403, 'forbidden');
      if (t.status === 'done') return res.status(200).json({ status: 'done', progress: t.progress, stats: t.stats });
      if (t.status !== 'copying') return fail(res, 409, 'wrong_state');
      if (t.lockUntil && t.lockUntil > Date.now()) return res.status(200).json({ status: 'busy', progress: t.progress });
      await tref.update({ lockUntil: Date.now() + 55000 });

      const sU = db.collection('users').doc(t.senderUid);
      const rU = db.collection('users').doc(t.receiverUid);
      const idMap = { ...(t.idMap || {}) };
      const stats = { ...t.stats };
      const progress = { ...t.progress };
      const importMark = { importedFrom: t.senderEmail || '', importedAt: Date.now() };
      let toolPos = t.toolPos, drawPos = t.drawPos;

      if (toolPos < t.toolQueue.length) {
        // ── dávka nástrojov ──
        const ids = t.toolQueue.slice(toolPos, toolPos + TOOL_CHUNK);
        const docs = await Promise.all(ids.map(id => sU.collection('tools').doc(id).get()));
        await pool(docs, 8, async (d) => {
          if (!d.exists) return;
          const data = d.data();
          const photo = await copyPhoto(data.fileData, data.filePath, t.senderUid, t.receiverUid, 'tools');
          const ref = rU.collection('tools').doc();
          await ref.set({ ...data, fileData: photo.url || null, filePath: photo.path || null, ...importMark });
          idMap[d.id] = ref.id;
          stats.toolsCopied++;
          if (photo.path && photo.path !== data.filePath) stats.photosCopied++;
        });
        toolPos += ids.length;
        progress.toolsDone += ids.length;
      } else if (drawPos < t.drawQueue.length) {
        // ── dávka výkresov ──
        const ids = t.drawQueue.slice(drawPos, drawPos + DRAW_CHUNK);
        const docs = await Promise.all(ids.map(id => sU.collection('drawings').doc(id).get()));
        await pool(docs, 4, async (d) => {
          if (!d.exists) return;
          const data = d.data();
          // Výkres s rovnakým číslom už prijímač má → preskočiť
          const dup = await rU.collection('drawings').where('number', '==', data.number).limit(1).get();
          if (!dup.empty) { stats.drawingsSkipped++; return; }
          const photos = (data.photos && data.photos.length) ? data.photos : (data.fileData ? [data.fileData] : []);
          const paths = data.photoPaths || [];
          const copied = await pool(photos, 4, (url, i) => copyPhoto(url, paths[i], t.senderUid, t.receiverUid, 'drawings'));
          copied.forEach((p, i) => { if (p.path && p.path !== paths[i]) stats.photosCopied++; });
          const newPhotos = copied.map(p => p.url);
          await rU.collection('drawings').add({
            ...data,
            photos: newPhotos,
            photoPaths: copied.map(p => p.path || null),
            fileData: newPhotos[0] || null,
            toolIds: (data.toolIds || []).map(id => idMap[id]).filter(Boolean),
            ...importMark,
          });
          stats.drawingsCopied++;
        });
        drawPos += ids.length;
        progress.drawingsDone += ids.length;
      }

      const done = toolPos >= t.toolQueue.length && drawPos >= t.drawQueue.length;
      await tref.update({
        idMap, stats, progress, toolPos, drawPos, lockUntil: 0,
        status: done ? 'done' : 'copying',
        ...(done ? { finishedAt: Date.now() } : {}),
      });
      return res.status(200).json({ status: done ? 'done' : 'copying', progress, stats });
    }

    return fail(res, 400, 'unknown_action');
  } catch (err) {
    console.error('transfer error:', action, err);
    if (tref) { try { await tref.update({ lockUntil: 0 }); } catch (e) {} }
    return fail(res, 500, 'server_error');
  }
}

module.exports = handler;
