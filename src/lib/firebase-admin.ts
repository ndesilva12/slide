import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App | undefined;
let db: Firestore | undefined;

function getFirebaseAdmin() {
  if (!app && getApps().length === 0) {
    // Check for service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (serviceAccount) {
      // Use service account if available (production)
      try {
        const credentials = JSON.parse(serviceAccount);
        app = initializeApp({
          credential: cert(credentials),
          projectId: projectId,
        });
      } catch (e) {
        console.error('Failed to parse service account:', e);
      }
    } else if (projectId) {
      // Use project ID only (works in some environments)
      app = initializeApp({
        projectId: projectId,
      });
    }
  } else if (getApps().length > 0) {
    app = getApps()[0];
  }

  if (app && !db) {
    db = getFirestore(app);
  }

  return { app, db };
}

export { getFirebaseAdmin };
