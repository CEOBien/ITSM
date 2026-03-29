import { ObjectType } from './enums/locking.enum';

/**
 * Map từ ObjectType sang tên bảng PostgreSQL.
 * Dùng trong condition evaluator để fetch bản ghi thực tế.
 */
export const OBJECT_TYPE_TABLE_MAP: Record<ObjectType, string> = {
  [ObjectType.INCIDENT]: 'incidents',
  [ObjectType.CHANGE]: 'changes',
  [ObjectType.PROBLEM]: 'problems',
  [ObjectType.SERVICE_REQUEST]: 'service_requests',
  [ObjectType.KNOWLEDGE_ARTICLE]: 'knowledge_articles',
  [ObjectType.CATALOG_ITEM]: 'catalog_items',
  [ObjectType.CMDB_CI]: 'configuration_items',
};

/**
 * Events emitted bởi LockingService.
 * Các module khác có thể listen để ghi audit log.
 */
export const LOCKING_EVENTS = {
  CONFIG_CREATED: 'locking.config.created',
  CONFIG_UPDATED: 'locking.config.updated',
  CONFIG_DELETED: 'locking.config.deleted',
  LOCK_ACQUIRED: 'locking.lock.acquired',
  LOCK_RELEASED: 'locking.lock.released',
  LOCK_EXPIRED: 'locking.lock.expired',
} as const;

export const LOCKABLE_KEY = 'lockable:objectType';
