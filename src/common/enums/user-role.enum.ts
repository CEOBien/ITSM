export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  SERVICE_DESK = 'service_desk',
  TECHNICIAN = 'technician',
  CHANGE_MANAGER = 'change_manager',
  PROBLEM_MANAGER = 'problem_manager',
  RELEASE_MANAGER = 'release_manager',
  ASSET_MANAGER = 'asset_manager',
  KNOWLEDGE_MANAGER = 'knowledge_manager',
  APPROVER = 'approver',
  END_USER = 'end_user',
  REPORT_VIEWER = 'report_viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_ACTIVATION = 'pending_activation',
  LOCKED = 'locked',
}
