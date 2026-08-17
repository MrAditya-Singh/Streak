import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
let authAdmin = null;
let isFirebaseInitialized = false;

try {
  let serviceAccount = null;
  let usedSource = null;

  // 1. Direct JSON / Base64 Environment Variable (Render / Vercel / Cloud Production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      usedSource = 'FIREBASE_SERVICE_ACCOUNT_JSON env variable';
    } catch (e) {
      console.warn('Could not parse FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
      usedSource = 'FIREBASE_SERVICE_ACCOUNT_BASE64 env variable';
    } catch (e) {
      console.warn('Could not parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e.message);
    }
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };
    usedSource = 'Individual FIREBASE_* env variables';
  }

  // 2. Local File Paths fallback (Development)
  if (!serviceAccount) {
    const possiblePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      path.resolve(__dirname, '../../../firebase-service-account.json'),
      path.resolve(__dirname, '../../firebase-service-account.json'),
      path.resolve(process.cwd(), 'firebase-service-account.json'),
      path.resolve(process.cwd(), '../firebase-service-account.json'),
    ].filter(Boolean);

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
        usedSource = path.basename(filePath);
        break;
      }
    }
  }

  if (serviceAccount && serviceAccount.project_id && serviceAccount.private_key) {
    if (typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
    db = getFirestore();
    db.settings({ ignoreUndefinedProperties: true });
    authAdmin = getAuth();
    isFirebaseInitialized = true;
    console.log(`🔥 Firebase Admin & Firestore initialized successfully using: ${usedSource} [Project: ${serviceAccount.project_id}]`);
  } else {
    console.warn('⚠️ No valid Firebase credentials found in env or file. Running in memory-cache mode.');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
}

export { db, authAdmin, isFirebaseInitialized };

