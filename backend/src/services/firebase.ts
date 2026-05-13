import admin from 'firebase-admin';

// Initialize Firebase Admin (will use FIREBASE_CONFIG env variable or service account file)
let initialized = false;

export const initializeFirebase = () => {
  if (!initialized) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback: use default application credentials
      admin.initializeApp();
    }
    initialized = true;
  }
};

export const verifyToken = async (token: string) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
};

export default admin;
