// src/types/auditLog.types.ts

import { Timestamp } from "firebase/firestore";

export type AuditAction =
  // Customer Actions
  | "CREATED_CUSTOMER"
  | "UPDATED_CUSTOMER"
  | "DELETED_CUSTOMER"
  | "CHANGED_CUSTOMER_STATUS"
  | "ASSIGNED_UNIT_TO_CUSTOMER"
  | "REMOVED_UNIT_FROM_CUSTOMER"
  | "UPDATED_CUSTOMER_UNIT"
  | "ADMIN_CREATED_GOOGLE"
  | "ADMIN_CREATED_PHONE"
  
  // Ticket Actions
  | "CREATED_TICKET"
  | "UPDATED_TICKET"
  | "ASSIGNED_TICKET"
  | "CHANGED_TICKET_STATUS"
  | "CHANGED_TICKET_PRIORITY"
  | "ADDED_TICKET_MESSAGE"
  | "ADDED_TICKET_NOTE"
  | "REMOVED_TICKET_NOTE"
  | "REOPENED_TICKET"
  | "CLOSED_TICKET"
  
  // Generator Model Actions
  | "CREATED_GENERATOR_MODEL"
  | "UPDATED_GENERATOR_MODEL"
  | "DELETED_GENERATOR_MODEL"
  
  // Purchase Request Actions
  | "CREATED_PURCHASE_REQUEST"
  | "UPDATED_PURCHASE_REQUEST"
  | "CHANGED_REQUEST_STATUS"
  | "ASSIGNED_UNIT_TO_REQUEST"
  | "ADDED_REQUEST_NOTE"
  | "COMPLETED_REQUEST"
  
  // Admin Actions
  | "CREATED_ADMIN"
  | "UPDATED_ADMIN"
  | "DISABLED_ADMIN"
  | "ENABLED_ADMIN"
  | "DELETED_ADMIN"
  | "CHANGED_ADMIN_ROLE"
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT";

export type EntityType = 
  | "customer" 
  | "ticket" 
  | "generator" 
  | "purchaseRequest" 
  | "admin";

export interface AuditLogMetadata {
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  additionalInfo?: Record<string, any>;
}

export interface AuditLog {
  id?: string;
  action: AuditAction;
  
  // Who performed the action
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminRole: "admin" | "superAdmin";
  
  // What was affected
  entityType: EntityType;
  entityId: string;
  entityName: string; // Human-readable reference
  
  // What changed
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  changes: string[]; // Human-readable change summary
  
  // Additional context
  metadata: AuditLogMetadata;
  
  // When it happened
  createdAt: Timestamp | Date;
}

export interface AuditLogFilter {
  adminId?: string;
  action?: AuditAction;
  entityType?: EntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface CreateAuditLogInput {
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  metadata?: AuditLogMetadata;
}