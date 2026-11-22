const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const uid = process.argv[2];
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");

if (!uid || !projectId || !clientEmail || !privateKey) {
  console.error("Usage: npm run admin:grant -- <firebase-user-uid> (with Firebase Admin credentials in .env.local)");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

async function grantAdmin() {
  const auth = getAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
  console.log(`Administrator access granted to ${user.email || uid}. Sign out and sign in again to refresh the claim.`);
}

grantAdmin().catch((error) => {
  console.error("Could not grant administrator access:", error.message);
  process.exitCode = 1;
});
