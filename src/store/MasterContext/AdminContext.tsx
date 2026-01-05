// src/store/MasterContext/AdminContext.tsx

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, functions } from '../../service/firebase';
import toast from 'react-hot-toast';
import { auditLogger } from '../../service/auditLogger';
import { getFunctions, httpsCallable } from 'firebase/functions';



export interface AdminPermissions {
  customers: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  tickets: {
    create: boolean;
    view: boolean;
    assign: boolean;
    update: boolean;
    delete: boolean;
  };
  generators: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  purchaseRequests: {
    read: boolean;
    update: boolean;
    create: boolean;
    delete: boolean;
  };
  admins: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  reports: {
    read: boolean;
    export: boolean;
  };
}

export interface LoginRecord {
  timestamp: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface Admin {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'superAdmin';
  status: 'active' | 'inactive';
  permissions: AdminPermissions;
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
  updatedBy?: string;
  lastLogin?: any;
  loginHistory?: LoginRecord[];
}

interface AdminContextType {
  admins: Admin[];
  loading: boolean;
  fetchAdmins: () => Promise<void>;
  getAdminById: (id: string) => Promise<Admin | null>;
  createAdmin: (adminData: Omit<Admin, 'id' | 'uid' | 'createdAt' | 'createdBy' | 'lastLogin' | 'loginHistory'> & { password: string }) => Promise<void>;
  updateAdmin: (id: string, updates: Partial<Admin>) => Promise<void>;
  updateAdminPermissions: (id: string, permissions: AdminPermissions) => Promise<void>;
  updateAdminStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
  updateAdminRole: (id: string, role: 'admin' | 'superAdmin') => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;
  trackLogin: (adminId: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);


// Default permissions for new admins
const getDefaultPermissions = (role: 'admin' | 'superAdmin'): AdminPermissions => {
  if (role === 'superAdmin') {
    return {
      customers: { create: true, read: true, update: true, delete: true },
      tickets: { create: true, view: true, assign: true, update: true, delete: true },
      generators: { create: true, read: true, update: true, delete: true },
      purchaseRequests: { read: true, update: true, create: true, delete: true },
      admins: { create: true, read: true, update: true, delete: true },
      reports: { read: true, export: true },
    };
  }
  
  // Default permissions for regular admin
  return {
    customers: { create: true, read: true, update: true, delete: false },
    tickets: { create: true, view: true, assign: true, update: true, delete: false },
    generators: { create: true, read: true, update: true, delete: false },
    purchaseRequests: { read: true, update: true, create: false, delete: false },
    admins: { create: false, read: false, update: false, delete: false },
    reports: { read: true, export: false },
  };
};

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const adminsData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Admin[];
      setAdmins(adminsData);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  }, []);

  const getAdminById = useCallback(async (id: string): Promise<Admin | null> => {
    try {
      const docRef = doc(db, 'admins', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Admin;
      }
      return null;
    } catch (error) {
      console.error('Error fetching admin:', error);
      toast.error('Failed to fetch admin details');
      return null;
    }
  }, []);

  const createAdmin = useCallback(
    async (adminData: Omit<Admin, 'id' | 'uid' | 'createdAt' | 'createdBy' | 'lastLogin' | 'loginHistory'> & { password: string }) => {
      setLoading(true);
      try {
        const currentAdminUid = auth.currentUser?.uid;

        if (!currentAdminUid) {
          throw new Error('You must be logged in to create admins');
        }

        // Create Firebase Auth user
        const userCred = await createUserWithEmailAndPassword(
          auth,
          adminData.email,
          adminData.password
        );

        const newAdminData = {
          uid: userCred.user.uid,
          name: adminData.name,
          email: adminData.email,
          role: adminData.role,
          status: adminData.status,
          permissions: adminData.permissions || getDefaultPermissions(adminData.role),
          createdAt: serverTimestamp(),
          createdBy: currentAdminUid,
          loginHistory: [],
        };

        await setDoc(doc(db, 'admins', userCred.user.uid), newAdminData);

        // 🔥 LOG AUDIT: Admin Created
        await auditLogger.log({
          action: 'CREATED_ADMIN',
          entityType: 'admin',
          entityId: userCred.user.uid,
          entityName: adminData.name,
          after: newAdminData,
        });

        toast.success('Admin created successfully!');
        await fetchAdmins();
      } catch (error: any) {
        console.error('Error creating admin:', error);
        toast.error(error.message || 'Failed to create admin');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmins]
  );

  const updateAdmin = useCallback(
    async (id: string, updates: Partial<Admin>) => {
      setLoading(true);
      try {
        const currentAdminUid = auth.currentUser?.uid;
        if (!currentAdminUid) throw new Error('Not authenticated');

        // Get before state
        const before = await getAdminById(id);

        const docRef = doc(db, 'admins', id);
        const updateData = {
          ...updates,
          updatedAt: serverTimestamp(),
          updatedBy: currentAdminUid,
        };

        await updateDoc(docRef, updateData);

        // Get after state
        const after = await getAdminById(id);

        // 🔥 LOG AUDIT: Admin Updated
        if (before && after) {
          await auditLogger.log({
            action: 'UPDATED_ADMIN',
            entityType: 'admin',
            entityId: id,
            entityName: after.name,
            before: before,
            after: after,
          });
        }

        toast.success('Admin updated successfully!');
        await fetchAdmins();
      } catch (error) {
        console.error('Error updating admin:', error);
        toast.error('Failed to update admin');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmins, getAdminById]
  );

  const updateAdminPermissions = useCallback(
    async (id: string, permissions: AdminPermissions) => {
      setLoading(true);
      try {
        const currentAdminUid = auth.currentUser?.uid;
        if (!currentAdminUid) throw new Error('Not authenticated');

        // Get before state
        const before = await getAdminById(id);

        const docRef = doc(db, 'admins', id);
        await updateDoc(docRef, {
          permissions,
          updatedAt: serverTimestamp(),
          updatedBy: currentAdminUid,
        });

        // Get after state
        const after = await getAdminById(id);

        // 🔥 LOG AUDIT: Permissions Updated
        if (before && after) {
          await auditLogger.log({
            action: 'UPDATED_ADMIN',
            entityType: 'admin',
            entityId: id,
            entityName: after.name,
            before: { permissions: before.permissions },
            after: { permissions: after.permissions },
          });
        }

        toast.success('Permissions updated successfully!');
        await fetchAdmins();
      } catch (error) {
        console.error('Error updating permissions:', error);
        toast.error('Failed to update permissions');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmins, getAdminById]
  );

 const updateAdminStatus = useCallback(
  async (id: string, status: 'active' | 'inactive') => {
    setLoading(true);
    try {
      const currentAdminUid = auth.currentUser?.uid;
      if (!currentAdminUid) throw new Error('Not authenticated');

      // Get before state for audit log
      const before = await getAdminById(id);

      // ✅ Call the cloud function instead of direct Firestore update
      const updateStatusFunction = httpsCallable(functions, 'updateAdminStatus');
      const result = await updateStatusFunction({ 
        uid: id, 
        status 
      });

      console.log('Status update result:', result.data);

      // Get after state for audit log
      const after = await getAdminById(id);

      // 🔥 LOG AUDIT: Status Changed
      if (before && after) {
        await auditLogger.log({
          action: status === 'active' ? 'ENABLED_ADMIN' : 'DISABLED_ADMIN',
          entityType: 'admin',
          entityId: id,
          entityName: after.name,
          before: { status: before.status },
          after: { status: after.status },
        });
      }

      toast.success(
        status === 'active' 
          ? 'Admin account activated successfully' 
          : 'Admin account deactivated successfully'
      );
      
      // Refresh the admins list to reflect changes
      await fetchAdmins();
    } catch (error: any) {
      console.error('Error updating admin status:', error);
      
      // Handle specific Firebase Functions error codes
      if (error.code === 'functions/permission-denied') {
        toast.error("You don't have permission to change your  status");
      } else if (error.code === 'functions/unauthenticated') {
        toast.error("You must be logged in to perform this action");
      } else if (error.code === 'functions/invalid-argument') {
        toast.error(error.message || "Invalid request data");
      } else {
        toast.error(error.message || 'Failed to update admin status');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  },
  [fetchAdmins, getAdminById]
);

  const updateAdminRole = useCallback(
    async (id: string, role: 'admin' | 'superAdmin') => {
      setLoading(true);
      try {
        const currentAdminUid = auth.currentUser?.uid;
        if (!currentAdminUid) throw new Error('Not authenticated');

        // Get before state
        const before = await getAdminById(id);

        const docRef = doc(db, 'admins', id);
        
        // Update role and adjust permissions accordingly
        const newPermissions = getDefaultPermissions(role);
        
        await updateDoc(docRef, {
          role,
          permissions: newPermissions,
          updatedAt: serverTimestamp(),
          updatedBy: currentAdminUid,
        });

        // Get after state
        const after = await getAdminById(id);

        // 🔥 LOG AUDIT: Role Changed
        if (before && after) {
          await auditLogger.log({
            action: 'CHANGED_ADMIN_ROLE',
            entityType: 'admin',
            entityId: id,
            entityName: after.name,
            before: { role: before.role, permissions: before.permissions },
            after: { role: after.role, permissions: after.permissions },
          });
        }

        toast.success(`Admin role updated to ${role} successfully!`);
        await fetchAdmins();
      } catch (error) {
        console.error('Error updating admin role:', error);
        toast.error('Failed to update admin role');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmins, getAdminById]
  );

  // Delete Admin Function
 const deleteAdmin = useCallback(
  async (id: string) => {
    setLoading(true);
    try {
      const currentAdminUid = auth.currentUser?.uid;
      if (!currentAdminUid) throw new Error('Not authenticated');

      // Get admin data before deletion
      const admin = await getAdminById(id);

      if (!admin) {
        throw new Error('Admin not found');
      }

      // Prevent self-deletion
      if (admin.uid === currentAdminUid) {
        throw new Error('You cannot delete your own account');
      }

      console.log('Attempting to delete admin:', {
        adminId: id,
        adminUid: admin.uid,
        currentUserUid: currentAdminUid
      });

      // Get functions instance
      const deleteAdminAccount = httpsCallable(functions, 'deleteAdminAccount');
      
      // ✅ Call the cloud function with the correct data structure
      const result = await deleteAdminAccount({ 
        uid: admin.uid  // Make sure we're sending the uid from the admin object
      });
      
      console.log('Delete result:', result.data);

      // 🔥 LOG AUDIT: Admin Deleted
      await auditLogger.log({
        action: 'DELETED_ADMIN',
        entityType: 'admin',
        entityId: id,
        entityName: admin.name,
        before: admin,
      });

      toast.success('Admin deleted successfully!');
      await fetchAdmins();
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      
      // Handle Firebase Functions specific errors
      if (error.code === 'functions/permission-denied') {
        toast.error('You do not have permission to delete admin accounts');
      } else if (error.code === 'functions/unauthenticated') {
        toast.error('Authentication required');
      } else if (error.code === 'functions/invalid-argument') {
        toast.error('Invalid request: Admin ID is missing or invalid');
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete admin');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  },
  [fetchAdmins, getAdminById]
);

  const trackLogin = useCallback(async (adminId: string) => {
    try {
      const docRef = doc(db, 'admins', adminId);
      
      const loginRecord: LoginRecord = {
        timestamp: serverTimestamp(),
        ipAddress: undefined, // Can be added if you have IP detection
        userAgent: navigator.userAgent,
      };

      await updateDoc(docRef, {
        lastLogin: serverTimestamp(),
        loginHistory: arrayUnion(loginRecord),
      });

      // 🔥 LOG AUDIT: Admin Login
      const admin = await getAdminById(adminId);
      if (admin) {
        await auditLogger.log({
          action: 'ADMIN_LOGIN',
          entityType: 'admin',
          entityId: adminId,
          entityName: admin.name,
          after: { loginTime: new Date().toISOString() },
        });
      }
    } catch (error) {
      console.error('Error tracking login:', error);
      // Don't throw error - login tracking failure shouldn't block login
    }
  }, [getAdminById]);

  const value = {
    admins,
    loading,
    fetchAdmins,
    getAdminById,
    createAdmin,
    updateAdmin,
    updateAdminPermissions,
    updateAdminStatus,
    updateAdminRole,
    deleteAdmin,
    trackLogin,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};