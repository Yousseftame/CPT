// src/service/googleAuthService.ts

import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, db, googleProvider } from './firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auditLogger } from './auditLogger';
import { trackLoginDirect } from './loginTracker';


/**
 * Configure Google Sign-In settings
 */
export const configureGoogleAuth = () => {
  // Only allow Google accounts from your domain (optional)
  // googleProvider.setCustomParameters({ hd: 'yourdomain.com' });
  
  // Force account selection every time
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
};

/**
 * Sign in with Google
 * Creates or updates user in Firestore
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user already exists in admins collection
    const docRef = doc(db, 'admins', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Create new admin account from Google Sign-In
      await setDoc(docRef, {
        uid: user.uid,
        name: user.displayName || 'Unknown User',
        email: user.email,
        photoURL: user.photoURL || null,
        role: 'admin', // Default role for new Google sign-in users
        status: 'active',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        authProvider: 'google',
        emailVerified: user.emailVerified,
      });

      // Log admin creation
      await auditLogger.log({
        action: 'ADMIN_CREATED_GOOGLE',
        entityType: 'admin',
        entityId: user.uid,
        entityName: user.displayName || user.email || 'Unknown',
        after: {
          email: user.email,
          provider: 'google',
        },
      });
    } else {
      // Update existing user
      const adminData = docSnap.data();
      
      // Check if account is active
      if (adminData.status === 'inactive') {
        await signOut(auth);
        throw new Error('Account is inactive. Please contact a super admin.');
      }

      // Update last login and auth provider
      await setDoc(
        docRef,
        {
          lastLogin: serverTimestamp(),
          authProvider: 'google',
          emailVerified: user.emailVerified,
        },
        { merge: true }
      );
    }

    // Store admin data in localStorage
    const adminDoc = await getDoc(docRef);
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userStatus', data.status);
    }

    // Track login
    await trackLoginDirect(user.uid);

    return result;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Get configured Google provider
 */
export const getGoogleProvider = () => {
  return googleProvider;
};