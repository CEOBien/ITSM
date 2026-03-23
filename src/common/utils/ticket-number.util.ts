import { v4 as uuidv4 } from 'uuid';

/**
 * Ticket Number Generator Utility
 * Generates ITIL-compliant ticket numbers for all ticket types
 * Format: PREFIX-YYYYMMDD-XXXXXX (e.g., INC-20240321-000001)
 */
export class TicketNumberUtil {
  private static counters = new Map<string, number>();

  /**
   * Generate a ticket number with a given prefix
   * @param prefix - Ticket prefix (INC, PRB, CHG, REQ, REL)
   * @param sequence - Optional sequence number (auto-incremented if not provided)
   */
  static generate(prefix: string, sequence?: number): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    if (sequence !== undefined) {
      return `${prefix}-${dateStr}-${String(sequence).padStart(6, '0')}`;
    }

    const key = `${prefix}-${dateStr}`;
    const current = (this.counters.get(key) || 0) + 1;
    this.counters.set(key, current);

    return `${prefix}-${dateStr}-${String(current).padStart(6, '0')}`;
  }

  /**
   * Generate incident number
   */
  static incident(sequence?: number): string {
    return this.generate(process.env.INCIDENT_PREFIX || 'INC', sequence);
  }

  /**
   * Generate problem number
   */
  static problem(sequence?: number): string {
    return this.generate(process.env.PROBLEM_PREFIX || 'PRB', sequence);
  }

  /**
   * Generate change number
   */
  static change(sequence?: number): string {
    return this.generate(process.env.CHANGE_PREFIX || 'CHG', sequence);
  }

  /**
   * Generate service request number
   */
  static request(sequence?: number): string {
    return this.generate(process.env.REQUEST_PREFIX || 'REQ', sequence);
  }

  /**
   * Generate release number
   */
  static release(sequence?: number): string {
    return this.generate(process.env.RELEASE_PREFIX || 'REL', sequence);
  }

  /**
   * Parse ticket number to extract prefix, date, and sequence
   */
  static parse(ticketNumber: string): { prefix: string; date: string; sequence: number } | null {
    const parts = ticketNumber.split('-');
    if (parts.length !== 3) return null;

    return {
      prefix: parts[0],
      date: parts[1],
      sequence: parseInt(parts[2], 10),
    };
  }

  /**
   * Validate ticket number format
   */
  static isValid(ticketNumber: string): boolean {
    const pattern = /^[A-Z]{2,5}-\d{8}-\d{6}$/;
    return pattern.test(ticketNumber);
  }

  /**
   * Generate a unique correlation ID for tracking
   */
  static correlationId(): string {
    return uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
  }
}
