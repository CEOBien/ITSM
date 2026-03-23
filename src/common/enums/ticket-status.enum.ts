/**
 * Ticket Status Enums - ITIL v4 compliant lifecycle states
 */

// ============================================================
// Incident Status Lifecycle (ITIL Incident Management)
// ============================================================
export enum IncidentStatus {
  NEW = 'new',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending', // Chờ thông tin từ người dùng
  ON_HOLD = 'on_hold', // Tạm dừng (chờ bên thứ 3)
  RESOLVED = 'resolved', // Đã giải quyết, chờ xác nhận
  CLOSED = 'closed', // Đã đóng
  CANCELLED = 'cancelled', // Đã hủy
  REOPENED = 'reopened', // Mở lại
}

// ============================================================
// Problem Status Lifecycle (ITIL Problem Management)
// ============================================================
export enum ProblemStatus {
  NEW = 'new',
  UNDER_INVESTIGATION = 'under_investigation',
  ROOT_CAUSE_IDENTIFIED = 'root_cause_identified',
  KNOWN_ERROR = 'known_error', // Known Error Database
  FIX_IN_PROGRESS = 'fix_in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

// ============================================================
// Change Status Lifecycle (ITIL Change Enablement)
// ============================================================
export enum ChangeStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted', // Gửi lên để review
  UNDER_REVIEW = 'under_review', // CAB đang xem xét
  APPROVED = 'approved', // Được duyệt
  REJECTED = 'rejected', // Bị từ chối
  SCHEDULED = 'scheduled', // Đã lên lịch
  IN_PROGRESS = 'in_progress', // Đang thực hiện
  IMPLEMENTED = 'implemented', // Đã triển khai
  FAILED = 'failed', // Thất bại
  ROLLED_BACK = 'rolled_back', // Đã rollback
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

// ============================================================
// Change Type (ITIL Change Enablement)
// ============================================================
export enum ChangeType {
  STANDARD = 'standard', // Pre-approved, low risk
  NORMAL = 'normal', // Requires full CAB approval
  EMERGENCY = 'emergency', // Urgent, emergency CAB
}

// ============================================================
// Service Request Status Lifecycle (ITIL Service Request Management)
// ============================================================
export enum RequestStatus {
  NEW = 'new',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  FULFILLED = 'fulfilled', // Đã hoàn thành
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

// ============================================================
// Release Status Lifecycle (ITIL Release Management)
// ============================================================
export enum ReleaseStatus {
  DRAFT = 'draft',
  PLANNING = 'planning',
  BUILDING = 'building',
  TESTING = 'testing',
  TEST_FAILED = 'test_failed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DEPLOYING = 'deploying',
  DEPLOYED = 'deployed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

// ============================================================
// SLA Status
// ============================================================
export enum SlaStatus {
  ACTIVE = 'active',
  WARNING = 'warning', // 75% của thời gian đã trôi qua
  BREACHED = 'breached', // Đã vi phạm SLA
  PAUSED = 'paused', // Tạm dừng (ngoài giờ làm việc)
  COMPLETED = 'completed', // Đã hoàn thành trong SLA
}

// ============================================================
// CI (Configuration Item) Status
// ============================================================
export enum CiStatus {
  ORDERED = 'ordered',
  RECEIVED = 'received',
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  DISPOSED = 'disposed',
  STOLEN = 'stolen',
  MISSING = 'missing',
}

// ============================================================
// Knowledge Article Status
// ============================================================
export enum KnowledgeStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated',
}

// ============================================================
// Approval Status
// ============================================================
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ABSTAINED = 'abstained',
}
