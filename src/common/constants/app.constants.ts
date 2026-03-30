/**
 * Application-wide constants
 */

// ============================================================
// SLA mặc định (phút) — dùng khi chưa có SLA entity; DateUtil.calculateSlaDeadline
// ============================================================
export const SLA_TIMES = {
  INCIDENT: {
    CRITICAL: { response: 15, resolution: 240 },
    HIGH: { response: 30, resolution: 480 },
    MEDIUM: { response: 120, resolution: 1440 },
    LOW: { response: 480, resolution: 4320 },
    PLANNING: { response: 1440, resolution: 10080 },
  },
  SERVICE_REQUEST: {
    HIGH: { response: 60, resolution: 480 },
    MEDIUM: { response: 240, resolution: 1440 },
    LOW: { response: 480, resolution: 4320 },
  },
} as const;

// ============================================================
// Pagination
// ============================================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ============================================================
// Cache Keys
// ============================================================
export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  USER_LIST: 'users:list',
  SLA: (id: string) => `sla:${id}`,
  SLA_LIST: 'slas:list',
  CATALOG: (id: string) => `catalog:${id}`,
  CATALOG_LIST: 'catalogs:list',
  KNOWLEDGE: (id: string) => `knowledge:${id}`,
  KNOWLEDGE_LIST: 'knowledge:list',
  CMDB_CI: (id: string) => `cmdb:ci:${id}`,
  PERMISSIONS: (roleId: string) => `permissions:role:${roleId}`,
  LOCKING_CONFIG: (objectType: string) => `locking:config:${objectType}`,
  LOCKING_CONFIG_LIST: 'locking:config:list',
} as const;

// ============================================================
// Cache TTL (seconds)
// ============================================================
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
  USER_SESSION: 3600,
  CATALOG_ITEM: 86400,
  SLA: 3600,
} as const;

// ============================================================
// Queue Names (Bull)
// ============================================================
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  SLA_MONITOR: 'sla-monitor',
  ESCALATION: 'escalation',
  REPORT: 'report',
  CMDB_SYNC: 'cmdb-sync',
  WORKFLOW: 'workflow',
} as const;

// ============================================================
// Event Names (EventEmitter)
// ============================================================
export const EVENTS = {
  INCIDENT: {
    CREATED: 'incident.created',
    UPDATED: 'incident.updated',
    ASSIGNED: 'incident.assigned',
    ESCALATED: 'incident.escalated',
    RESOLVED: 'incident.resolved',
    CLOSED: 'incident.closed',
    SLA_WARNING: 'incident.sla.warning',
    SLA_BREACHED: 'incident.sla.breached',
  },
  PROBLEM: {
    CREATED: 'problem.created',
    UPDATED: 'problem.updated',
    RESOLVED: 'problem.resolved',
    CLOSED: 'problem.closed',
    KNOWN_ERROR_REGISTERED: 'problem.known_error.registered',
  },
  CHANGE: {
    CREATED: 'change.created',
    UPDATED: 'change.updated',
    SUBMITTED: 'change.submitted',
    APPROVED: 'change.approved',
    REJECTED: 'change.rejected',
    IMPLEMENTED: 'change.implemented',
    CLOSED: 'change.closed',
    FAILED: 'change.failed',
  },
  REQUEST: {
    CREATED: 'request.created',
    APPROVED: 'request.approved',
    REJECTED: 'request.rejected',
    FULFILLED: 'request.fulfilled',
    CANCELLED: 'request.cancelled',
  },
  USER: {
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    PASSWORD_CHANGED: 'user.password.changed',
    PASSWORD_RESET: 'user.password.reset',
  },
  SLA: {
    WARNING: 'sla.warning',
    BREACHED: 'sla.breached',
    PAUSED: 'sla.paused',
    RESUMED: 'sla.resumed',
  },
  LOCKING: {
    CONFIG_CREATED: 'locking.config.created',
    CONFIG_UPDATED: 'locking.config.updated',
    CONFIG_DELETED: 'locking.config.deleted',
    LOCK_ACQUIRED: 'locking.lock.acquired',
    LOCK_RELEASED: 'locking.lock.released',
    LOCK_EXPIRED: 'locking.lock.expired',
  },
} as const;

// ============================================================
// Roles & Permissions
// ============================================================
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SERVICE_DESK: 'service_desk',
  TECHNICIAN: 'technician',
  CHANGE_MANAGER: 'change_manager',
  PROBLEM_MANAGER: 'problem_manager',
  RELEASE_MANAGER: 'release_manager',
  ASSET_MANAGER: 'asset_manager',
  KNOWLEDGE_MANAGER: 'knowledge_manager',
  APPROVER: 'approver',
  END_USER: 'end_user',
  REPORT_VIEWER: 'report_viewer',
} as const;

// ============================================================
// Permission Actions
// ============================================================
export const PERMISSIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  ASSIGN: 'assign',
  ESCALATE: 'escalate',
  CLOSE: 'close',
  REOPEN: 'reopen',
  EXPORT: 'export',
  IMPORT: 'import',
} as const;

// ============================================================
// HTTP Response Messages
// ============================================================
export const RESPONSE_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  CONFLICT: 'Resource already exists',
  BAD_REQUEST: 'Invalid request',
} as const;

// ============================================================
// Workflow States (Generic)
// ============================================================
export const WORKFLOW_STATES = {
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// ============================================================
// Attachment Types
// ============================================================
export const ATTACHMENT_TYPES = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  SPREADSHEET: 'spreadsheet',
  ARCHIVE: 'archive',
  OTHER: 'other',
} as const;

// ============================================================
// Notification Channels
// ============================================================
export const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app',
  WEBHOOK: 'webhook',
} as const;

// ============================================================
// Audit Actions
// ============================================================
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  ASSIGN: 'ASSIGN',
  ESCALATE: 'ESCALATE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  SYSTEM: 'SYSTEM',
} as const;
