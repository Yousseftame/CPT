import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize admin SDK only once
if (getApps().length === 0) {
  initializeApp();
}

interface DeleteAdminData {
  uid: string;
}

export const deleteAdminAccount = onCall<DeleteAdminData>(
  async (request: CallableRequest<DeleteAdminData>) => {
    // Log the incoming request for debugging
    console.log('Delete admin request received:', {
      auth: request.auth?.uid,
      data: request.data
    });

    const { auth, data } = request;

    // Must be authenticated
    if (!auth) {
      console.error('Authentication missing');
      throw new HttpsError('unauthenticated', 'Not authenticated');
    }

    // Check if data exists and has uid
    if (!data || !data.uid) {
      console.error('Invalid data received:', data);
      throw new HttpsError('invalid-argument', 'UID is required in the request data');
    }

    const { uid } = data;

    // Prevent self-deletion
    if (auth.uid === uid) {
      console.error('Self-deletion attempt');
      throw new HttpsError(
        'permission-denied',
        'You cannot delete your own account'
      );
    }

    try {
      const db = getFirestore();
      const adminAuth = getAuth();

      // Verify the caller is a superAdmin
      const callerDoc = await db.collection('admins').doc(auth.uid).get();
      
      if (!callerDoc.exists) {
        console.error('Caller document not found');
        throw new HttpsError('permission-denied', 'Admin record not found');
      }

      const callerData = callerDoc.data();
      
      if (callerData?.role !== 'superAdmin') {
        console.error('Caller is not superAdmin:', callerData?.role);
        throw new HttpsError(
          'permission-denied',
          'Only super admins can delete admin accounts'
        );
      }

      console.log('Deleting admin:', uid);

      // Delete from Firestore first
      await db.collection('admins').doc(uid).delete();
      console.log('Deleted from Firestore');

      // Delete from Authentication
      try {
        await adminAuth.deleteUser(uid);
        console.log('Deleted from Authentication');
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found') {
          console.log('User not found in Authentication, but deleted from Firestore');
          return { 
            success: true, 
            message: 'Admin deleted from Firestore (was not found in Authentication)' 
          };
        }
        throw authError;
      }

      return { 
        success: true, 
        message: 'Admin account deleted successfully' 
      };
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      
      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error;
      }
      
      // Wrap other errors
      throw new HttpsError(
        'internal',
        error.message || 'Failed to delete admin account'
      );
    }
  }
);

