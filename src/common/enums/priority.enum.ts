/**
 * Priority Enum - ITIL v4 standard priority matrix
 * Based on Impact x Urgency matrix
 */
export enum Priority {
  CRITICAL = 'critical', // P1 - Impact: Enterprise, Urgency: Immediate
  HIGH = 'high', // P2 - Impact: Department, Urgency: High
  MEDIUM = 'medium', // P3 - Impact: Group, Urgency: Medium
  LOW = 'low', // P4 - Impact: Individual, Urgency: Low
  PLANNING = 'planning', // P5 - Planned work, no urgency
}

export enum Impact {
  ENTERPRISE = 'enterprise', // Ảnh hưởng toàn tổ chức (1)
  DEPARTMENT = 'department', // Ảnh hưởng phòng ban (2)
  GROUP = 'group', // Ảnh hưởng nhóm (3)
  INDIVIDUAL = 'individual', // Ảnh hưởng cá nhân (4)
}

export enum Urgency {
  IMMEDIATE = 'immediate', // Ngay lập tức (1)
  HIGH = 'high', // Trong vòng 4h (2)
  MEDIUM = 'medium', // Trong ngày (3)
  LOW = 'low', // Trong tuần (4)
}

/**
 * Priority Matrix mapping (Impact x Urgency -> Priority)
 * Based on ITIL v4 recommendations
 */
export const PRIORITY_MATRIX: Record<Impact, Record<Urgency, Priority>> = {
  [Impact.ENTERPRISE]: {
    [Urgency.IMMEDIATE]: Priority.CRITICAL,
    [Urgency.HIGH]: Priority.CRITICAL,
    [Urgency.MEDIUM]: Priority.HIGH,
    [Urgency.LOW]: Priority.HIGH,
  },
  [Impact.DEPARTMENT]: {
    [Urgency.IMMEDIATE]: Priority.CRITICAL,
    [Urgency.HIGH]: Priority.HIGH,
    [Urgency.MEDIUM]: Priority.HIGH,
    [Urgency.LOW]: Priority.MEDIUM,
  },
  [Impact.GROUP]: {
    [Urgency.IMMEDIATE]: Priority.HIGH,
    [Urgency.HIGH]: Priority.MEDIUM,
    [Urgency.MEDIUM]: Priority.MEDIUM,
    [Urgency.LOW]: Priority.LOW,
  },
  [Impact.INDIVIDUAL]: {
    [Urgency.IMMEDIATE]: Priority.MEDIUM,
    [Urgency.HIGH]: Priority.LOW,
    [Urgency.MEDIUM]: Priority.LOW,
    [Urgency.LOW]: Priority.PLANNING,
  },
};
