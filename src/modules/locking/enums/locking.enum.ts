/**
 * Các object type mà hệ thống hỗ trợ locking.
 * Phải khớp với tên module nghiệp vụ tương ứng.
 */
export enum ObjectType {
  INCIDENT = 'incident',
  CHANGE = 'change',
  PROBLEM = 'problem',
  SERVICE_REQUEST = 'service_request',
  KNOWLEDGE_ARTICLE = 'knowledge_article',
  CATALOG_ITEM = 'catalog_item',
  CMDB_CI = 'cmdb_ci',
}

/**
 * Chế độ locking.
 * - none: không lock (mặc định khi tắt)
 * - optimistic: kiểm tra version khi save, phát hiện xung đột sau khi save
 * - pessimistic: khóa bản ghi ngay khi mở form edit, người khác chỉ view
 * - both: áp dụng cả 2 — pessimistic để UX, optimistic làm safety net
 */
export enum LockingMode {
  NONE = 'none',
  OPTIMISTIC = 'optimistic',
  PESSIMISTIC = 'pessimistic',
  BOTH = 'both',
}

/**
 * Toán tử so sánh trong condition rules
 */
export enum ConditionOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  IN = 'in',
  NOT_IN = 'not_in',
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
}

/**
 * Toán tử logic kết hợp các rules
 */
export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
}
