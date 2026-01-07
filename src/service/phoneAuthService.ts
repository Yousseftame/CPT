// src/service/phoneAuthService.ts (COMPLETELY FIXED)

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

/**
 * Wait for reCAPTCHA script to load
 */
const waitForRecaptcha = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
      console.log('✅ reCAPTCHA already loaded');
      resolve();
      return;
    }

    console.log('⏳ Waiting for reCAPTCHA to load...');
    
    let attempts = 0;
    const maxAttempts = 150; // 15 seconds
    const checkInterval = 100; // Check every 100ms

    const checkRecaptcha = () => {
      attempts++;
      
      if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
        console.log(`✅ reCAPTCHA loaded after ${attempts * checkInterval}ms`);
        resolve();
      } else if (attempts >= maxAttempts) {
        console.error('❌ reCAPTCHA failed to load after 15 seconds');
        reject(new Error(
          'reCAPTCHA failed to load. Please check:\n' +
          '1. Your internet connection\n' +
          '2. Ad blockers or privacy extensions are disabled\n' +
          '3. Your firewall allows Google services\n' +
          '4. Try refreshing the page'
        ));
      } else {
        setTimeout(checkRecaptcha, checkInterval);
      }
    };

    checkRecaptcha();
  });
};

/**
 * Initialize reCAPTCHA verifier
 */
export const initializeRecaptcha = async (
  containerId: string = 'recaptcha-container'
): Promise<RecaptchaVerifier> => {
  try {
    // Clear existing verifier
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
        console.log('🧹 Cleared existing reCAPTCHA verifier');
      } catch (e) {
        console.log('Note: Could not clear existing verifier');
      }
      recaptchaVerifier = null;
    }

    // Wait for reCAPTCHA script to load
    console.log('🔄 Waiting for reCAPTCHA script...');
    await waitForRecaptcha();

    // Verify the container exists
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(
        `reCAPTCHA container #${containerId} not found. ` +
        `Make sure you have <div id="${containerId}"></div> in your Login component.`
      );
    }

    console.log('🔧 Creating reCAPTCHA verifier...');

    // Create new verifier
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('✅ reCAPTCHA verified successfully');
      },
      'expired-callback': () => {
        console.warn('⚠️ reCAPTCHA token expired');
        recaptchaVerifier = null;
      },
      'error-callback': (error: any) => {
        console.error('❌ reCAPTCHA error:', error);
        recaptchaVerifier = null;
      },
    });

    // Render the verifier
    await recaptchaVerifier.render();
    console.log('✅ reCAPTCHA verifier initialized successfully');

    return recaptchaVerifier;
  } catch (error: any) {
    console.error('❌ Failed to initialize reCAPTCHA:', error);
    recaptchaVerifier = null;
    throw new Error(
      error.message || 
      'Failed to initialize phone verification. Please refresh the page and try again.'
    );
  }
};

/**
 * Clear reCAPTCHA verifier
 */
export const clearRecaptcha = () => {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
      console.log('🧹 Cleared reCAPTCHA verifier');
    } catch (e) {
      console.log('Note: Could not clear verifier');
    }
    recaptchaVerifier = null;
  }
};

/**
 * Send OTP to phone number
 */
export const sendPhoneOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
  try {
    // Validate phone number format
    if (!phoneNumber.startsWith('+')) {
      throw new Error('Phone number must start with country code (e.g., +1 for USA)');
    }

    // Remove all non-digit characters except +
    const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Validate length
    if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 15) {
      throw new Error('Phone number must be 10-15 digits');
    }

    console.log('📱 Sending OTP to:', cleanPhoneNumber);

    // Initialize reCAPTCHA if not already done
    if (!recaptchaVerifier) {
      console.log('🔄 Initializing reCAPTCHA...');
      recaptchaVerifier = await initializeRecaptcha();
    }

    // Send OTP
    console.log('📤 Requesting OTP from Firebase...');
    confirmationResult = await signInWithPhoneNumber(
      auth,
      cleanPhoneNumber,
      recaptchaVerifier
    );

    console.log('✅ OTP sent successfully');
    return confirmationResult;

  } catch (error: any) {
    console.error('❌ Error sending OTP:', error);
    
    // Clear verifier on error
    clearRecaptcha();
    confirmationResult = null;

    // User-friendly error messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number. Include country code (e.g., +1 for USA)');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please wait before trying again.');
    } else if (error.code === 'auth/invalid-app-credential') {
      throw new Error(
        'Phone authentication not configured. Please contact support.'
      );
    } else if (error.code === 'auth/missing-client-identifier') {
      throw new Error('Verification failed. Please refresh and try again.');
    } else if (error.message?.includes('reCAPTCHA')) {
      throw error; // Re-throw reCAPTCHA errors as-is
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

    const cleanOTP = otp.replace(/\s/g, '');

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

      if (adminData.status === 'inactive') {
        await signOut(auth);
        throw new Error('Account is inactive. Please contact a super admin.');
      }

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

    // Store admin data
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
    } else if (error.message?.includes('Account is inactive')) {
      throw error;
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
  console.log('🚫 Phone sign-in cancelled');
};

/**
 * Get confirmation result
 */
export const getConfirmationResult = (): ConfirmationResult | null => {
  return confirmationResult;
};