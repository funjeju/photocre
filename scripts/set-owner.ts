/**
 * 특정 이메일 계정에 isOwner: true 를 세팅하는 1회용 스크립트
 * 실행: npx ts-node -e "require('dotenv').config({path:'.env.local'})" scripts/set-owner.ts
 */
import * as admin from 'firebase-admin';

const EMAIL = 'naggu1999@gmail.com';

function init() {
  if (admin.apps.length > 0) return admin.apps[0]!;
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
        ?.replace(/^"|"$/g, '')
        ?.replace(/\\n/g, '\n'),
    }),
  });
}

async function main() {
  init();
  const auth = admin.auth();
  const db = admin.firestore();

  const user = await auth.getUserByEmail(EMAIL);
  console.log('UID:', user.uid);

  await db.collection('users').doc(user.uid).set(
    { isOwner: true, credits: 9999 },
    { merge: true },
  );

  console.log('Done — isOwner: true, credits: 9999 set for', EMAIL);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
