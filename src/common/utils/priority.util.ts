import { Priority, Impact, Urgency, PRIORITY_MATRIX } from '../enums';

/**
 * Priority Calculator Utility
 * Implements ITIL v4 Impact x Urgency Priority Matrix
 */
export class PriorityUtil {
  /**
   * Calculate priority based on impact and urgency (ITIL Matrix)
   */
  static calculate(impact: Impact, urgency: Urgency): Priority {
    return PRIORITY_MATRIX[impact][urgency];
  }

  /**
   * Get priority weight for sorting (lower = higher priority)
   */
  static getWeight(priority: Priority): number {
    const weights = {
      [Priority.CRITICAL]: 1,
      [Priority.HIGH]: 2,
      [Priority.MEDIUM]: 3,
      [Priority.LOW]: 4,
      [Priority.PLANNING]: 5,
    };
    return weights[priority] || 99;
  }

  /**
   * Get priority display color (for UI)
   */
  static getColor(priority: Priority): string {
    const colors = {
      [Priority.CRITICAL]: '#FF0000', // Red
      [Priority.HIGH]: '#FF6600', // Orange
      [Priority.MEDIUM]: '#FFCC00', // Yellow
      [Priority.LOW]: '#33CC33', // Green
      [Priority.PLANNING]: '#0066FF', // Blue
    };
    return colors[priority] || '#999999';
  }

  /**
   * Get priority display label in Vietnamese
   */
  static getLabel(priority: Priority): string {
    const labels = {
      [Priority.CRITICAL]: 'Nghiêm trọng',
      [Priority.HIGH]: 'Cao',
      [Priority.MEDIUM]: 'Trung bình',
      [Priority.LOW]: 'Thấp',
      [Priority.PLANNING]: 'Lập kế hoạch',
    };
    return labels[priority] || priority;
  }

  /**
   * Check if priority requires immediate escalation
   */
  static requiresImmediateEscalation(priority: Priority): boolean {
    return priority === Priority.CRITICAL || priority === Priority.HIGH;
  }

  /**
   * Compare priorities (returns negative if a < b, 0 if equal, positive if a > b)
   */
  static compare(a: Priority, b: Priority): number {
    return this.getWeight(a) - this.getWeight(b);
  }
}
