import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize admin SDK only once
if (getApps().length === 0) {
  initializeApp();
}

interface UpdateAdminStatusData {
  uid: string;
  status: 'active' | 'inactive';
}

export const updateAdminStatus = onCall<UpdateAdminStatusData>(
  async (request: CallableRequest<UpdateAdminStatusData>) => {
    console.log('Update admin status request received:', {
      auth: request.auth?.uid,
      data: request.data
    });

    const { auth, data } = request;

    // Must be authenticated
    if (!auth) {
      console.error('Authentication missing');
      throw new HttpsError('unauthenticated', 'Not authenticated');
    }

    // Validate data
    if (!data || !data.uid || !data.status) {
      console.error('Invalid data received:', data);
      throw new HttpsError('invalid-argument', 'UID and status are required');
    }

    const { uid, status } = data;

    // Validate status value
    if (status !== 'active' && status !== 'inactive') {
      throw new HttpsError('invalid-argument', 'Status must be either "active" or "inactive"');
    }

    // Prevent self-status change
    if (auth.uid === uid) {
      console.error('Self-status change attempt');
      throw new HttpsError(
        'permission-denied',
        'You cannot change your own status'
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
          'Only super admins can change admin status'
        );
      }

      console.log('Updating admin status:', uid, 'to', status);

      // Update Firestore first
      await db.collection('admins').doc(uid).update({
        status: status,
        updatedAt: new Date()
      });
      console.log('Updated Firestore document');

      // Update Firebase Authentication - disable/enable user
      try {
        await adminAuth.updateUser(uid, {
          disabled: status === 'inactive'
        });
        console.log('Updated Firebase Authentication');
      } catch (authError: any) {
        console.error('Error updating auth:', authError);
        
        // If user not found in auth, still return success for Firestore update
        if (authError.code === 'auth/user-not-found') {
          console.log('User not found in Authentication, but Firestore updated');
          return { 
            success: true, 
            message: 'Status updated in Firestore (user not found in Authentication)' 
          };
        }
        throw authError;
      }

      return { 
        success: true, 
        message: `Admin account ${status === 'active' ? 'activated' : 'deactivated'} successfully` 
      };
    } catch (error: any) {
      console.error('Error updating admin status:', error);
      
      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error;
      }
      
      // Wrap other errors
      throw new HttpsError(
        'internal',
        error.message || 'Failed to update admin status'
      );
    }
  }
);