// src/service/auditLogger.ts

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  getDocs,
  Timestamp,
  serverTimestamp 
} from "firebase/firestore";
import { db, auth } from "./firebase";
import type { 
  AuditLog, 
  CreateAuditLogInput, 
  AuditLogFilter 
} from "../types/auditLog.types";

class AuditLoggerService {
  private collectionName = "adminLogs";

  /**
   * Get current admin information from auth and localStorage
   */
  private async getCurrentAdmin() {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    const adminName = localStorage.getItem("userName") || currentUser.email || "Unknown Admin";
    const adminRole = (localStorage.getItem("userRole") as "admin" | "superAdmin") || "admin";

    return {
      adminId: currentUser.uid,
      adminName,
      adminEmail: currentUser.email || "unknown@email.com",
      adminRole,
    };
  }

  /**
   * Generate human-readable change summary
   */
  private generateChanges(before: Record<string, any> | null, after: Record<string, any> | null): string[] {
    const changes: string[] = [];

    if (!before || !after) {
      return changes;
    }

    // Compare all keys in both objects
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    allKeys.forEach((key) => {
      // Skip system fields and complex objects
      if (key === "createdAt" || key === "updatedAt" || key === "id") {
        return;
      }

      const beforeValue = before[key];
      const afterValue = after[key];

      // Skip if values are the same
      if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) {
        return;
      }

      // Handle different types of changes
      if (beforeValue === undefined && afterValue !== undefined) {
        changes.push(`${key}: added "${this.formatValue(afterValue)}"`);
      } else if (beforeValue !== undefined && afterValue === undefined) {
        changes.push(`${key}: removed "${this.formatValue(beforeValue)}"`);
      } else {
        changes.push(`${key}: "${this.formatValue(beforeValue)}" → "${this.formatValue(afterValue)}"`);
      }
    });

    return changes;
  }

  /**
   * Format values for display
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return "null";
    }
    
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return `[${value.length} items]`;
      }
      return "[object]";
    }
    
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    
    return String(value);
  }

  /**
   * Log an action to the audit trail
   */
  async log(input: CreateAuditLogInput): Promise<void> {
    try {
      const admin = await this.getCurrentAdmin();

      const changes = this.generateChanges(
        input.before || null,
        input.after || null
      );

      const auditLog: Omit<AuditLog, "id"> = {
        action: input.action,
        adminId: admin.adminId,
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        adminRole: admin.adminRole,
        entityType: input.entityType,
        entityId: input.entityId,
        entityName: input.entityName,
        before: input.before || null,
        after: input.after || null,
        changes,
        metadata: input.metadata || {},
        createdAt: serverTimestamp() as any,
      };

      await addDoc(collection(db, this.collectionName), auditLog);
      
      console.log("✅ Audit log created:", input.action);
    } catch (error) {
      console.error("❌ Failed to create audit log:", error);
      // Don't throw error - logging should not break the main operation
    }
  }

  /**
   * Fetch audit logs with filters
   */
  async getLogs(filters: AuditLogFilter = {}): Promise<AuditLog[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        orderBy("createdAt", "desc")
      );

      // Apply filters
      if (filters.adminId) {
        q = query(q, where("adminId", "==", filters.adminId));
      }

      if (filters.action) {
        q = query(q, where("action", "==", filters.action));
      }

      if (filters.entityType) {
        q = query(q, where("entityType", "==", filters.entityType));
      }

      if (filters.entityId) {
        q = query(q, where("entityId", "==", filters.entityId));
      }

      if (filters.startDate) {
        q = query(q, where("createdAt", ">=", Timestamp.fromDate(filters.startDate)));
      }

      if (filters.endDate) {
        q = query(q, where("createdAt", "<=", Timestamp.fromDate(filters.endDate)));
      }

      if (filters.limit) {
        q = query(q, firestoreLimit(filters.limit));
      } else {
        q = query(q, firestoreLimit(100)); // Default limit
      }

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditLog[];
    } catch (error) {
      console.error("❌ Failed to fetch audit logs:", error);
      throw error;
    }
  }

  /**
   * Get logs for a specific entity
   */
  async getEntityLogs(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.getLogs({
      entityType: entityType as any,
      entityId,
      limit: 50,
    });
  }

  /**
   * Get recent activity for an admin
   */
  async getAdminActivity(adminId: string, limit: number = 20): Promise<AuditLog[]> {
    return this.getLogs({
      adminId,
      limit,
    });
  }

  /**
   * Get all logs for a date range
   */
  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    return this.getLogs({
      startDate,
      endDate,
      limit: 500,
    });
  }
}

// Export singleton instance
export const auditLogger = new AuditLoggerService();

// Export helper functions for common operations
export const logCustomerCreated = async (customerId: string, customerData: any) => {
  await auditLogger.log({
    action: "CREATED_CUSTOMER",
    entityType: "customer",
    entityId: customerId,
    entityName: customerData.name,
    after: customerData,
  });
};



export const logCustomerUpdated = async (customerId: string, before: any, after: any) => {
  await auditLogger.log({
    action: "UPDATED_CUSTOMER",
    entityType: "customer",
    entityId: customerId,
    entityName: after.name || before.name,
    before,
    after,
  });
};

export const logCustomerDeleted = async (customerId: string, customerData: any) => {
  await auditLogger.log({
    action: "DELETED_CUSTOMER",
    entityType: "customer",
    entityId: customerId,
    entityName: customerData.name,
    before: customerData,
  });
};

export const logTicketStatusChanged = async (ticketId: string, ticketSubject: string, before: any, after: any) => {
  await auditLogger.log({
    action: "CHANGED_TICKET_STATUS",
    entityType: "ticket",
    entityId: ticketId,
    entityName: ticketSubject,
    before,
    after,
  });
};

export const logTicketAssigned = async (ticketId: string, ticketSubject: string, before: any, after: any) => {
  await auditLogger.log({
    action: "ASSIGNED_TICKET",
    entityType: "ticket",
    entityId: ticketId,
    entityName: ticketSubject,
    before,
    after,
  });
};

export const logGeneratorCreated = async (modelId: string, modelData: any) => {
  await auditLogger.log({
    action: "CREATED_GENERATOR_MODEL",
    entityType: "generator",
    entityId: modelId,
    entityName: modelData.name,
    after: modelData,
  });
};

export const logGeneratorUpdated = async (modelId: string, before: any, after: any) => {
  await auditLogger.log({
    action: "UPDATED_GENERATOR_MODEL",
    entityType: "generator",
    entityId: modelId,
    entityName: after.name || before.name,
    before,
    after,
  });
};

export const logGeneratorDeleted = async (modelId: string, modelData: any) => {
  await auditLogger.log({
    action: "DELETED_GENERATOR_MODEL",
    entityType: "generator",
    entityId: modelId,
    entityName: modelData.name,
    before: modelData,
  });
};

export const logRequestStatusChanged = async (requestId: string, customerName: string, before: any, after: any) => {
  await auditLogger.log({
    action: "CHANGED_REQUEST_STATUS",
    entityType: "purchaseRequest",
    entityId: requestId,
    entityName: `Request from ${customerName}`,
    before,
    after,
  });
};