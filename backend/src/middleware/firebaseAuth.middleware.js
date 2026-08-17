import { authAdmin, isFirebaseInitialized } from '../config/firebase.js';

/**
 * 🔒 Express Middleware: Verifies Firebase ID Token from Authorization: Bearer <ID_TOKEN>
 * Populates req.user = { uid, email, name } on success.
 * Rejects with 401 Unauthorized on invalid/missing token.
 */
export const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Format must be: Bearer <ID_TOKEN>',
    });
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();

  if (!idToken) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'No Firebase ID token provided in Authorization header',
    });
  }

  // Fallback for local development if Firebase Admin credentials are missing
  if (!isFirebaseInitialized || !authAdmin) {
    console.warn('⚠️ Firebase Admin SDK uninitialized. Using authenticated fallback user.');
    req.user = {
      uid: 'dev_local_uid',
      email: 'dev@local.com',
      name: 'Local Dev User',
    };
    return next();
  }

  try {
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || '',
    };
    console.log(`✅ [Auth Middleware] Verified Firebase ID Token for UID: ${req.user.uid} (${req.user.email})`);
    next();
  } catch (error) {
    console.error('❌ [Auth Middleware] Firebase ID Token Verification Failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired Firebase ID token',
      details: error.message,
    });
  }
};
