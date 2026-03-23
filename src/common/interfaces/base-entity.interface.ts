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
  role: string;
  departmentId?: string;
  permissions?: string[];
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
