// AlkeShop Cloud Functions. Deployed as their own codebase ("alkeshop") into
// the shared Alkebuleum project, so deploying them never touches Nuru's.
//
//   shopAuth  — wallet sign-in: verifies a signature, returns a Firebase
//               custom token whose claims carry the wallet (and staff flag)
//   shopApi   — every shop action: { op, ...args } (see src/shop.js); emails
//               sellers through Brevo with the BREVO_API_KEY secret
//   shopTick  — every minute: settles payments and runs order timers
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const { getFirestore } = require("firebase-admin/firestore");
const { DATABASE, cfg } = require("./src/config");
const { verifySignIn, AuthError } = require("./src/auth");
const { OPS, ShopError, tick } = require("./src/shop");
const { rpc } = require("./src/rpc");

admin.initializeApp();
const db = getFirestore(DATABASE);

function asHttpsError(e, tag) {
  if (e instanceof functions.https.HttpsError) return e;
  if (e instanceof ShopError) return new functions.https.HttpsError(e.code, e.message);
  if (e instanceof AuthError) return new functions.https.HttpsError("permission-denied", e.message);
  console.error(tag, e);
  return new functions.https.HttpsError("internal", "Something went wrong on our side. Please try again.");
}

exports.shopAuth = functions.https.onCall(async (data) => {
  try {
    const wallet = await verifySignIn(data || {});
    // One use per signature.
    const used = db.doc(`authUsed/${crypto.createHash("sha256").update(String(data.signature).toLowerCase()).digest("hex")}`);
    await used.create({ wallet, at: Date.now() }).catch(() => { throw new AuthError("That sign-in was already used. Try again."); });
    const { admins } = cfg();
    const isAdmin = admins.includes(wallet) || admins.includes(String(data.key).toLowerCase());
    const token = await admin.auth().createCustomToken(`shop:${wallet}`, { shopWallet: wallet, shopAdmin: isAdmin });
    return { token, wallet, admin: isAdmin };
  } catch (e) {
    throw asHttpsError(e, "shopAuth");
  }
});

exports.shopApi = functions.runWith({ secrets: ["BREVO_API_KEY"] }).https.onCall(async (data, context) => {
  const wallet = context.auth?.token?.shopWallet;
  if (!wallet) throw new functions.https.HttpsError("unauthenticated", "Sign in with your wallet first.");
  const { op, ...args } = data || {};
  const run = OPS[op];
  if (!run) throw new functions.https.HttpsError("invalid-argument", "Unknown operation.");
  try {
    return await run({ db, wallet, admin: context.auth.token.shopAdmin === true, bucket: admin.storage().bucket(cfg().bucket), rpc }, args);
  } catch (e) {
    throw asHttpsError(e, `shopApi.${op}`);
  }
});

exports.shopTick = functions.pubsub.schedule("every 1 minutes").onRun(async () => {
  const r = await tick(db, { rpc });
  if (r.settled || r.timed) console.log("shopTick", r);
});
