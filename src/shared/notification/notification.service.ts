import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS, NOTIFICATION_CHANNELS } from '../../common/constants';

export interface NotificationPayload {
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async send(payload: NotificationPayload): Promise<void> {
    this.logger.log(
      `[NOTIFICATION] Channel: ${payload.channel}, Recipient: ${payload.recipient}, Subject: ${payload.subject}`,
    );
  }

  async sendToUser(userId: string, subject: string, body: string, data?: any): Promise<void> {
    await this.send({
      channel: NOTIFICATION_CHANNELS.IN_APP,
      recipient: userId,
      subject,
      body,
      data,
    });
  }

  async sendEmail(to: string, subject: string, body: string, data?: any): Promise<void> {
    await this.send({ channel: NOTIFICATION_CHANNELS.EMAIL, recipient: to, subject, body, data });
  }

  // ============================================================
  // Incident event handlers
  // ============================================================
  @OnEvent(EVENTS.INCIDENT.CREATED)
  async onIncidentCreated(event: any): Promise<void> {
    this.logger.log(`Incident created: ${event.incidentNumber} (${event.priority})`);
  }

  @OnEvent(EVENTS.INCIDENT.ASSIGNED)
  async onIncidentAssigned(event: any): Promise<void> {
    if (event.assigneeId) {
      await this.sendToUser(
        event.assigneeId,
        'Sự cố được giao cho bạn',
        `Sự cố ${event.incidentId} đã được giao cho bạn để xử lý`,
        event,
      );
    }
  }

  @OnEvent(EVENTS.INCIDENT.ESCALATED)
  async onIncidentEscalated(event: any): Promise<void> {
    this.logger.warn(`Incident escalated: ${event.incidentId} to L${event.level}`);
  }

  @OnEvent(EVENTS.INCIDENT.SLA_BREACHED)
  async onSlaBreached(event: any): Promise<void> {
    this.logger.warn(`SLA BREACHED: ${event.incidentId} - ${event.type}`);
  }

  @OnEvent(EVENTS.INCIDENT.RESOLVED)
  async onIncidentResolved(event: any): Promise<void> {
    this.logger.log(`Incident resolved: ${event.incidentId}`);
  }

  // ============================================================
  // Change event handlers
  // ============================================================
  @OnEvent(EVENTS.CHANGE.SUBMITTED)
  async onChangeSubmitted(event: any): Promise<void> {
    this.logger.log(`Change submitted for approval: ${event.changeId}`);
  }

  @OnEvent(EVENTS.CHANGE.APPROVED)
  async onChangeApproved(event: any): Promise<void> {
    this.logger.log(`Change approved: ${event.changeId}`);
  }

  @OnEvent(EVENTS.CHANGE.REJECTED)
  async onChangeRejected(event: any): Promise<void> {
    this.logger.log(`Change rejected: ${event.changeId}`);
  }

  // ============================================================
  // User event handlers
  // ============================================================
  @OnEvent(EVENTS.USER.CREATED)
  async onUserCreated(event: any): Promise<void> {
    this.logger.log(`New user created: ${event.email}`);
  }

  @OnEvent(EVENTS.USER.PASSWORD_RESET)
  async onPasswordReset(event: any): Promise<void> {
    await this.sendEmail(
      event.email,
      'Đặt lại mật khẩu ITSM',
      `Xin chào ${event.fullName}, click vào link sau để đặt lại mật khẩu: /reset-password?token=${event.resetToken}`,
      event,
    );
  }
}
