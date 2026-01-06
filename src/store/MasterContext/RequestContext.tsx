// src/store/MasterContext/RequestContext.tsx

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db, auth } from '../../service/firebase';
import toast from 'react-hot-toast';
import { auditLogger } from '../../service/auditLogger';

export interface AssignedUnit {
  modelId: string;
  serial: string;
  assignedAt: string;
}

export interface InternalNote {
  note: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

export interface PurchaseRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  modelId: string;
  requestedUnits: number;
  status: 'new' | 'in_review' | 'contacted' | 'approved' | 'rejected' | 'completed';
  createdAt: any;
  assignedUnits?: AssignedUnit[];
  internalNotes?: InternalNote[];
  updatedAt?: any;
  updatedBy?: string;
}

interface RequestContextType {
  requests: PurchaseRequest[];
  loading: boolean;
  fetchRequests: () => Promise<void>;
  getRequestById: (id: string) => Promise<PurchaseRequest | null>;
  updateRequestStatus: (id: string, status: PurchaseRequest['status']) => Promise<void>;
  assignUnit: (requestId: string, unit: Omit<AssignedUnit, 'assignedAt'>) => Promise<void>;
  addInternalNote: (requestId: string, note: string) => Promise<void>;
  completeRequest: (requestId: string) => Promise<void>;
  updateAssignedUnit: (requestId: string, unitIndex: number, updatedUnit: Omit<AssignedUnit, 'assignedAt'>) => Promise<void>;
  removeAssignedUnit: (requestId: string, unitIndex: number) => Promise<void>;
  removeInternalNote: (requestId: string, noteIndex: number) => Promise<void>;
}

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const RequestProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'purchaseRequests'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PurchaseRequest[];
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch purchase requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const getRequestById = useCallback(async (id: string): Promise<PurchaseRequest | null> => {
    try {
      const docRef = doc(db, 'purchaseRequests', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as PurchaseRequest;
      }
      return null;
    } catch (error) {
      console.error('Error fetching request:', error);
      toast.error('Failed to fetch request details');
      return null;
    }
  }, []);

  const updateRequestStatus = useCallback(
    async (id: string, status: PurchaseRequest['status']) => {
      try {
        const adminUid = auth.currentUser?.uid;
        if (!adminUid) throw new Error('Not authenticated');

        const docRef = doc(db, 'purchaseRequests', id);

        // Get current data before update
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          toast.error('Request not found');
          return;
        }

        const beforeData = docSnap.data();
        const oldStatus = beforeData.status;

        await updateDoc(docRef, {
          status: status,
          [`${status}At`]: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          updatedBy: adminUid,
        });

        // 🔥 LOG AUDIT: Request Status Changed
        await auditLogger.log({
          action: 'CHANGED_REQUEST_STATUS',
          entityType: 'purchaseRequest',
          entityId: id,
          entityName: `Request from ${beforeData.customerName || 'Unknown'}`,
          before: {
            status: oldStatus,
            customerName: beforeData.customerName,
            modelId: beforeData.modelId,
            requestedUnits: beforeData.requestedUnits,
          },
          after: {
            status: status,
            customerName: beforeData.customerName,
            modelId: beforeData.modelId,
            requestedUnits: beforeData.requestedUnits,
          },
        });

        toast.success(`Status updated to ${status}`);
        await fetchRequests();
      } catch (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status');
        throw error;
      }
    },
    [fetchRequests]
  );

  const assignUnit = useCallback(
    async (requestId: string, unit: Omit<AssignedUnit, 'assignedAt'>) => {
      try {
        const adminUid = auth.currentUser?.uid;
        if (!adminUid) throw new Error('Not authenticated');

        const docRef = doc(db, 'purchaseRequests', requestId);

        const newUnit = {
          modelId: unit.modelId,
          serial: unit.serial,
          assignedAt: new Date().toISOString(),
        };

        await updateDoc(docRef, {
          assignedUnits: arrayUnion(newUnit),
          updatedAt: serverTimestamp(),
          updatedBy: adminUid,
        });

        // Get model name
        const modelDoc = await getDoc(doc(db, 'generatorModels', unit.modelId));
        const modelName = modelDoc.exists() ? modelDoc.data().name : unit.modelId;

        // Get request info
        const request = await getRequestById(requestId);

        // 🔥 LOG AUDIT: Unit Assigned to Request
        if (request) {
          await auditLogger.log({
            action: 'ASSIGNED_UNIT_TO_REQUEST',
            entityType: 'purchaseRequest',
            entityId: requestId,
            entityName: `Request from ${request.customerName || 'Unknown'}`,
            after: {
              unit: {
                modelId: unit.modelId,
                modelName: modelName,
                serial: unit.serial,
              },
            },
          });
        }

        toast.success('Unit assigned successfully!');
        await fetchRequests();
      } catch (error) {
        console.error('Error assigning unit:', error);
        toast.error('Failed to assign unit');
        throw error;
      }
    },
    [fetchRequests, getRequestById]
  );

  const addInternalNote = useCallback(
    async (requestId: string, note: string) => {
      try {
        const adminUid = auth.currentUser?.uid;
        const adminName = localStorage.getItem('userName') || 'Admin';

        if (!adminUid) throw new Error('Not authenticated');

        const docRef = doc(db, 'purchaseRequests', requestId);

        const newNote = {
          note,
          createdAt: new Date().toISOString(),
          createdBy: adminUid,
          createdByName: adminName,
        };

        await updateDoc(docRef, {
          internalNotes: arrayUnion(newNote),
          updatedAt: serverTimestamp(),
          updatedBy: adminUid,
        });

        // Get request info
        const request = await getRequestById(requestId);

        // 🔥 LOG AUDIT: Note Added to Request
        if (request) {
          await auditLogger.log({
            action: 'ADDED_REQUEST_NOTE',
            entityType: 'purchaseRequest',
            entityId: requestId,
            entityName: `Request from ${request.customerName || 'Unknown'}`,
            after: {
              note: note.substring(0, 100) + (note.length > 100 ? '...' : ''),
            },
          });
        }

        toast.success('Note added successfully!');
        await fetchRequests();
      } catch (error) {
        console.error('Error adding note:', error);
        toast.error('Failed to add note');
        throw error;
      }
    },
    [fetchRequests, getRequestById]
  );

  const completeRequest = useCallback(
    async (requestId: string) => {
      try {
        const adminUid = auth.currentUser?.uid;
        if (!adminUid) throw new Error('Not authenticated');

        const docRef = doc(db, 'purchaseRequests', requestId);

        // Get current status before update
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          toast.error('Request not found');
          return;
        }

        const oldStatus = docSnap.data().status;
        const customerName = docSnap.data().customerName;

        await updateDoc(docRef, {
          status: 'completed',
          updatedAt: serverTimestamp(),
          updatedBy: adminUid,
        });

        // 🔥 LOG AUDIT: Request Completed
        await auditLogger.log({
          action: 'COMPLETED_REQUEST',
          entityType: 'purchaseRequest',
          entityId: requestId,
          entityName: `Request from ${customerName || 'Unknown'}`,
          before: {
            status: oldStatus,
          },
          after: {
            status: 'completed',
          },
        });

        toast.success('Request marked as completed!');
        await fetchRequests();
      } catch (error) {
        console.error('Error completing request:', error);
        toast.error('Failed to complete request');
        throw error;
      }
    },
    [fetchRequests]
  );

  const updateAssignedUnit = useCallback(
    async (requestId: string, unitIndex: number, updatedUnit: Omit<AssignedUnit, 'assignedAt'>) => {
      try {
        const adminUid = auth.currentUser?.uid;
        if (!adminUid) throw new Error('Not authenticated');

        const request = await getRequestById(requestId);
        if (!request || !request.assignedUnits) throw new Error('Request not found');

        const updatedUnits = [...request.assignedUnits];
        updatedUnits[unitIndex] = {
          modelId: updatedUnit.modelId,
          serial: updatedUnit.serial,
          assignedAt: updatedUnits[unitIndex].assignedAt,
        };

        const docRef = doc(db, 'purchaseRequests', requestId);
        await updateDoc(docRef, {
          assignedUnits: updatedUnits,
          updatedAt: serverTimestamp(),
          updatedBy: adminUid,
        });

        toast.success('Unit updated successfully!');
        await fetchRequests();
      } catch (error) {
        console.error('Error updating unit:', error);
        toast.error('Failed to update unit');
        throw error;
      }
    },
    [fetchRequests, getRequestById]
  );

  const removeAssignedUnit = useCallback(
    async (requestId: string, unitIndex: number) => {
      try {
        const adminUid = auth.currentUser?.uid;
        if (!adminUid) throw new Error('Not authenticated');

        const request = await getRequestById(requestId);
        if (!request || !request.assignedUnits) throw new Error('Request not found');

        const updatedUnits = request.assignedUnits.filter((_, index) => index !== unitIndex);

        const docRef = doc(db, 'purchaseRequests', requestId);
        await updateDoc(docRef, {
          assignedUnits: updatedUnits,
          updatedAt: serverTimestamp(),
          updatedBy: adminUid,
        });

        toast.success('Unit removed successfully!');
        await fetchRequests();
      } catch (error) {
        console.error('Error removing unit:', error);
        toast.error('Failed to remove unit');
        throw error;
      }
    },
    [fetchRequests, getRequestById]
  );

  const removeInternalNote = useCallback(
    async (requestId: string, noteIndex: number) => {
      try {
        const adminUid = auth.currentUser?.uid;
        if (!adminUid) throw new Error('Not authenticated');

        const request = await getRequestById(requestId);
        if (!request || !request.internalNotes) throw new Error('Request not found');

        const updatedNotes = request.internalNotes.filter((_, index) => index !== noteIndex);

        const docRef = doc(db, 'purchaseRequests', requestId);
        await updateDoc(docRef, {
          internalNotes: updatedNotes,
          updatedAt: serverTimestamp(),
          updatedBy: adminUid,
        });

        toast.success('Note deleted successfully!');
        await fetchRequests();
      } catch (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
        throw error;
      }
    },
    [fetchRequests, getRequestById]
  );

  const value = {
    requests,
    loading,
    fetchRequests,
    getRequestById,
    updateRequestStatus,
    assignUnit,
    addInternalNote,
    completeRequest,
    updateAssignedUnit,
    removeAssignedUnit,
    removeInternalNote,
  };

  return <RequestContext.Provider value={value}>{children}</RequestContext.Provider>;
};

export const useRequest = () => {
  const context = useContext(RequestContext);
  if (context === undefined) {
    throw new Error('useRequest must be used within a RequestProvider');
  }
  return context;
};