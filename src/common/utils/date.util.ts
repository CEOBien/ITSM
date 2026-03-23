import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { SLA_TIMES } from '../constants';
import { Priority } from '../enums';

dayjs.extend(utc);
dayjs.extend(timezone);

const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'Asia/Ho_Chi_Minh';
const BUSINESS_HOURS_START = process.env.BUSINESS_HOURS_START || '08:00';
const BUSINESS_HOURS_END = process.env.BUSINESS_HOURS_END || '17:30';

/**
 * Date Utility - Business hours and SLA calculation
 * Handles ITIL SLA time calculations with business hour awareness
 */
export class DateUtil {
  /**
   * Get current datetime in business timezone
   */
  static now(): dayjs.Dayjs {
    return dayjs().tz(BUSINESS_TIMEZONE);
  }

  /**
   * Format date to standard ITSM display format
   */
  static format(date: Date | string | dayjs.Dayjs, format = 'DD/MM/YYYY HH:mm'): string {
    return dayjs(date).tz(BUSINESS_TIMEZONE).format(format);
  }

  /**
   * Check if given time is within business hours
   */
  static isBusinessHours(date: Date = new Date()): boolean {
    const d = dayjs(date).tz(BUSINESS_TIMEZONE);
    const dayOfWeek = d.day(); // 0 = Sunday, 6 = Saturday

    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    const [startHour, startMin] = BUSINESS_HOURS_START.split(':').map(Number);
    const [endHour, endMin] = BUSINESS_HOURS_END.split(':').map(Number);

    const currentMinutes = d.hour() * 60 + d.minute();
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  /**
   * Calculate SLA deadline based on priority and created time
   * @param priority - Ticket priority
   * @param createdAt - Ticket creation time
   * @param type - 'response' or 'resolution'
   * @returns SLA deadline Date
   */
  static calculateSlaDeadline(
    priority: Priority,
    createdAt: Date,
    type: 'response' | 'resolution' = 'resolution',
    slaMinutes?: number,
  ): Date {
    let minutes = slaMinutes;

    if (!minutes) {
      const slaConfig = SLA_TIMES.INCIDENT;
      const priorityMap: Record<Priority, { response: number; resolution: number }> = {
        [Priority.CRITICAL]: slaConfig.CRITICAL,
        [Priority.HIGH]: slaConfig.HIGH,
        [Priority.MEDIUM]: slaConfig.MEDIUM,
        [Priority.LOW]: slaConfig.LOW,
        [Priority.PLANNING]: slaConfig.PLANNING,
      };

      minutes = priorityMap[priority]?.[type] || 1440;
    }

    return this.addBusinessMinutes(createdAt, minutes);
  }

  /**
   * Add business minutes to a date (excludes weekends and non-business hours)
   */
  static addBusinessMinutes(startDate: Date, minutes: number): Date {
    let current = dayjs(startDate).tz(BUSINESS_TIMEZONE);
    let remainingMinutes = minutes;

    while (remainingMinutes > 0) {
      const dayOfWeek = current.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const [startHour, startMin] = BUSINESS_HOURS_START.split(':').map(Number);
        const [endHour, endMin] = BUSINESS_HOURS_END.split(':').map(Number);

        const dayStart = current.clone().hour(startHour).minute(startMin).second(0);
        const dayEnd = current.clone().hour(endHour).minute(endMin).second(0);

        if (current.isBefore(dayStart)) {
          current = dayStart;
        }

        if (current.isBefore(dayEnd)) {
          const minutesLeftInDay = dayEnd.diff(current, 'minute');
          if (remainingMinutes <= minutesLeftInDay) {
            current = current.add(remainingMinutes, 'minute');
            remainingMinutes = 0;
          } else {
            remainingMinutes -= minutesLeftInDay;
            current = current.add(1, 'day').hour(startHour).minute(startMin).second(0);
          }
        } else {
          current = current.add(1, 'day').hour(startHour).minute(startMin).second(0);
        }
      } else {
        current = current.add(1, 'day');
        const [startHour, startMin] = BUSINESS_HOURS_START.split(':').map(Number);
        current = current.hour(startHour).minute(startMin).second(0);
      }
    }

    return current.toDate();
  }

  /**
   * Calculate elapsed business minutes between two dates
   */
  static elapsedBusinessMinutes(start: Date, end: Date = new Date()): number {
    let current = dayjs(start).tz(BUSINESS_TIMEZONE);
    const endDate = dayjs(end).tz(BUSINESS_TIMEZONE);
    let elapsed = 0;

    while (current.isBefore(endDate)) {
      const dayOfWeek = current.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const [startHour, startMin] = BUSINESS_HOURS_START.split(':').map(Number);
        const [endHour, endMin] = BUSINESS_HOURS_END.split(':').map(Number);

        const dayStart = current.clone().hour(startHour).minute(startMin).second(0);
        const dayEnd = current.clone().hour(endHour).minute(endMin).second(0);

        const periodStart = current.isBefore(dayStart) ? dayStart : current;
        const periodEnd = endDate.isBefore(dayEnd) ? endDate : dayEnd;

        if (periodStart.isBefore(periodEnd)) {
          elapsed += periodEnd.diff(periodStart, 'minute');
        }
      }
      current = current.add(1, 'day').startOf('day');
    }

    return elapsed;
  }

  /**
   * Calculate SLA percentage consumed
   */
  static slaPercentage(createdAt: Date, deadline: Date, now: Date = new Date()): number {
    const totalMinutes = this.elapsedBusinessMinutes(createdAt, deadline);
    const elapsedMinutes = this.elapsedBusinessMinutes(createdAt, now);

    if (totalMinutes === 0) return 100;
    return Math.min(Math.round((elapsedMinutes / totalMinutes) * 100), 100);
  }

  /**
   * Check if SLA is breached
   */
  static isSlaBreached(deadline: Date, now: Date = new Date()): boolean {
    return dayjs(now).isAfter(dayjs(deadline));
  }

  /**
   * Get SLA remaining time in human readable format
   */
  static slaRemainingText(deadline: Date, now: Date = new Date()): string {
    const diff = dayjs(deadline).diff(dayjs(now), 'minute');
    if (diff < 0) {
      const absDiff = Math.abs(diff);
      if (absDiff < 60) return `Trễ ${absDiff} phút`;
      if (absDiff < 1440) return `Trễ ${Math.floor(absDiff / 60)} giờ ${absDiff % 60} phút`;
      return `Trễ ${Math.floor(absDiff / 1440)} ngày`;
    }
    if (diff < 60) return `Còn ${diff} phút`;
    if (diff < 1440) return `Còn ${Math.floor(diff / 60)} giờ ${diff % 60} phút`;
    return `Còn ${Math.floor(diff / 1440)} ngày`;
  }
}
