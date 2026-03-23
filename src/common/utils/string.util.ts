import * as crypto from 'crypto';

/**
 * String Utility functions
 */
export class StringUtil {
  /**
   * Convert string to slug format
   */
  static toSlug(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Generate random string
   */
  static random(length = 16): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }

  /**
   * Generate random password
   */
  static randomPassword(length = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Truncate string to specified length
   */
  static truncate(str: string, length = 100, suffix = '...'): string {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
  }

  /**
   * Mask sensitive data (e.g., email, phone)
   */
  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal =
      local.length > 3
        ? local.slice(0, 2) + '*'.repeat(local.length - 3) + local.slice(-1)
        : '*'.repeat(local.length);
    return `${maskedLocal}@${domain}`;
  }

  static maskPhone(phone: string): string {
    if (phone.length <= 4) return '*'.repeat(phone.length);
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }

  /**
   * Convert camelCase to snake_case
   */
  static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Capitalize first letter
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Remove HTML tags from string
   */
  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Parse CSV line with proper handling of quoted fields
   */
  static parseCsvLine(line: string, delimiter = ','): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  }
}
