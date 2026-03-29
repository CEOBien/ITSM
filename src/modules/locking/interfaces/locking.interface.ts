import { ConditionOperator, LogicalOperator } from '../enums/locking.enum';

/**
 * Một rule điều kiện đơn lẻ.
 * Ví dụ: { field: 'status', op: 'not_in', value: ['resolved', 'closed'] }
 */
export interface ConditionRule {
  field: string;
  op: ConditionOperator;
  value?: string | string[] | number | boolean | null;
}

/**
 * Cấu trúc conditions lưu trong JSONB.
 * Hỗ trợ lồng nhau (nested groups) để xây điều kiện phức tạp.
 */
export interface LockConditions {
  operator: LogicalOperator;
  rules: Array<ConditionRule | LockConditions>;
}

/**
 * Thông tin về active lock trả về cho client
 */
export interface LockInfo {
  isLocked: boolean;
  lockedBy?: string;
  lockedByName?: string;
  lockedAt?: Date;
  expiresAt?: Date;
  /** Lock của chính user đang gọi */
  isOwnLock?: boolean;
}
