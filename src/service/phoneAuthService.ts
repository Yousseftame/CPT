// src/service/phoneAuthService.ts (FIXED - Proper reCAPTCHA Loading)

import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type ConfirmationResult,
  signOut,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auditLogger } from './auditLogger';
import { trackLoginDirect } from './loginTracker';

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;
let recaptchaReady = false;
let recaptchaReadyPromise: Promise<void> | null = null;

/**
 * Wait for reCAPTCHA script to load
 */
const waitForRecaptcha = (): Promise<void> => {
  if (recaptchaReadyPromise) {
    return recaptchaReadyPromise;
  }

  recaptchaReadyPromise = new Promise((resolve, reject) => {
    const maxAttempts = 50; // 5 seconds max
    let attempts = 0;

    const checkRecaptcha = () => {
      if ((window as any).grecaptcha) {
        recaptchaReady = true;
        resolve();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkRecaptcha, 100);
      } else {
        reject(new Error('reCAPTCHA script failed to load. Please refresh the page.'));
      }
    };

    checkRecaptcha();
  });

  return recaptchaReadyPromise;
};

/**
 * Initialize reCAPTCHA verifier
 * IMPORTANT: Call this BEFORE sending OTP
 */
export const initializeRecaptcha = (containerId: string = 'recaptcha-container'): Promise<RecaptchaVerifier> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Clear existing verifier
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (e) {
          console.log('Could not clear existing verifier');
        }
        recaptchaVerifier = null;
      }

      // Wait for reCAPTCHA script to load
      try {
        await waitForRecaptcha();
      } catch (error) {
        reject(error);
        return;
      }

      // Verify the container exists
      const container = document.getElementById(containerId);
      if (!container) {
        reject(new Error(`reCAPTCHA container with id "${containerId}" not found in DOM`));
        return;
      }

      // Create new verifier
      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: (token: any) => {
          console.log('✅ reCAPTCHA verified');
        },
        'expired-callback': () => {
          console.log('⚠️ reCAPTCHA token expired');
          recaptchaVerifier = null;
        },
        'error-callback': (error: any) => {
          console.error('❌ reCAPTCHA error:', error);
          recaptchaVerifier = null;
        },
      });

      resolve(recaptchaVerifier);
    } catch (error) {
      console.error('Failed to initialize reCAPTCHA:', error);
      recaptchaVerifier = null;
      reject(error);
    }
  });
};

/**
 * Clear reCAPTCHA verifier
 */
export const clearRecaptcha = () => {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      console.log('Could not clear verifier');
    }
    recaptchaVerifier = null;
  }
};

/**
 * Send OTP to phone number
 * @param phoneNumber - Phone number in E.164 format (e.g., +15551234567)
 */
export const sendPhoneOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
  try {
    // Validate phone number format
    if (!phoneNumber.startsWith('+')) {
      throw new Error('Phone number must start with country code (e.g., +1 for USA)');
    }

    // Remove all non-digit characters except +
    const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Validate length (E.164 format: +[1-3 digits country code][subscriber number])
    if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 15) {
      throw new Error('Phone number must be 10-15 digits (excluding country code formatting)');
    }

    console.log('📱 Sending OTP to:', cleanPhoneNumber);

    // Initialize reCAPTCHA BEFORE sending OTP
    if (!recaptchaVerifier) {
      console.log('🔄 Initializing reCAPTCHA...');
      try {
        recaptchaVerifier = await initializeRecaptcha();
      } catch (error) {
        console.error('Failed to initialize reCAPTCHA:', error);
        throw error;
      }
    }

    // Send OTP with cleaned phone number
    confirmationResult = await signInWithPhoneNumber(
      auth,
      cleanPhoneNumber,
      recaptchaVerifier!
    );

    console.log('✅ OTP sent successfully');
    return confirmationResult;

  } catch (error: any) {
    console.error('❌ Error sending OTP:', error);
    
    // Clear verifier on error
    clearRecaptcha();
    confirmationResult = null;

    // Provide user-friendly error messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number. Make sure it includes the country code (e.g., +1 for USA).');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please wait a few minutes before trying again.');
    } else if (error.code === 'auth/invalid-app-credential') {
      throw new Error(
        'Phone authentication not properly configured. ' +
        'Please ensure:\n' +
        '1. Phone sign-in is enabled in Firebase Console\n' +
        '2. reCAPTCHA v3 is configured\n' +
        '3. Your app domain is authorized in Google Cloud Console'
      );
    } else if (error.code === 'auth/missing-client-identifier') {
      throw new Error('reCAPTCHA verification failed. Please refresh and try again.');
    } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
      throw new Error(
        'Phone authentication is not supported in this environment. ' +
        'Make sure you\'re accessing from an HTTPS domain (localhost works in dev).'
      );
    } else if (error.message?.includes('Invalid phone')) {
      throw new Error('Invalid phone number format. Example: +1 (555) 123-4567');
    } else {
      throw new Error(error.message || 'Failed to send OTP. Please try again.');
    }
  }
};

/**
 * Verify OTP and sign in
 */
export const verifyPhoneOTP = async (otp: string) => {
  try {
    if (!confirmationResult) {
      throw new Error('OTP request expired. Please request a new OTP.');
    }

    const cleanOTP = otp.replace(/\s/g, ''); // Remove spaces

    if (cleanOTP.length !== 6) {
      throw new Error('OTP must be 6 digits');
    }

    console.log('🔐 Verifying OTP...');

    // Verify OTP
    const result = await confirmationResult.confirm(cleanOTP);
    const user = result.user;

    console.log('✅ OTP verified successfully');

    // Check if user exists in admins collection
    const docRef = doc(db, 'admins', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('👤 Creating new admin account from phone sign-in');
      
      // Create new admin account
      await setDoc(docRef, {
        uid: user.uid,
        name: 'Phone User',
        email: user.email || null,
        phoneNumber: user.phoneNumber,
        role: 'admin',
        status: 'active',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        authProvider: 'phone',
        emailVerified: false,
        phoneVerified: true,
      });

      // Log creation
      await auditLogger.log({
        action: 'ADMIN_CREATED_PHONE',
        entityType: 'admin',
        entityId: user.uid,
        entityName: user.phoneNumber || 'Phone User',
        after: {
          phoneNumber: user.phoneNumber,
          provider: 'phone',
        },
      });
    } else {
      console.log('👤 Updating existing admin account');
      
      const adminData = docSnap.data();

      // Check if account is active
      if (adminData.status === 'inactive') {
        await signOut(auth);
        throw new Error('Account is inactive. Please contact a super admin.');
      }

      // Update last login
      await setDoc(
        docRef,
        {
          lastLogin: serverTimestamp(),
          authProvider: 'phone',
          phoneVerified: true,
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

    // Clean up
    confirmationResult = null;
    clearRecaptcha();

    return result;

  } catch (error: any) {
    console.error('❌ Error verifying OTP:', error);

    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP code. Please try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('OTP has expired. Please request a new one.');
    } else if (error.message?.includes('too many unsuccessful')) {
      throw new Error('Too many failed attempts. Please request a new OTP.');
    } else if (error.message?.includes('Account is inactive')) {
      throw error; // Re-throw our custom error
    } else {
      throw new Error(error.message || 'Failed to verify OTP.');
    }
  }
};

/**
 * Resend OTP
 */
export const resendPhoneOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
  try {
    console.log('🔄 Resending OTP...');
    
    // Clear previous state
    confirmationResult = null;
    clearRecaptcha();

    // Send new OTP
    return await sendPhoneOTP(phoneNumber);
  } catch (error) {
    throw error;
  }
};

/**
 * Cancel phone sign-in
 */
export const cancelPhoneSignIn = () => {
  confirmationResult = null;
  clearRecaptcha();
};

/**
 * Get confirmation result
 */
export const getConfirmationResult = (): ConfirmationResult | null => {
  return confirmationResult;
};