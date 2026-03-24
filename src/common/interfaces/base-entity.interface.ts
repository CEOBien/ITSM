export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  version: number;
}

export interface IAuditableEntity extends IBaseEntity {
  auditLogs?: any[];
}

export interface ISoftDeletable {
  deletedAt?: Date;
  isDeleted: boolean;
}

export interface ICurrentUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  /** Danh sách mã vai trò (vd: ['admin', 'approver']) */
  roles: string[];
  /** Danh sách mã quyền tổng hợp từ tất cả roles (vd: ['incidents:create', 'users:read']) */
  permissions: string[];
  organizationId?: string;
}

export interface IWorkflowEntity {
  currentState: string;
  previousState?: string;
  stateHistory?: WorkflowHistoryEntry[];
}

export interface WorkflowHistoryEntry {
  fromState: string;
  toState: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  comment?: string;
}
