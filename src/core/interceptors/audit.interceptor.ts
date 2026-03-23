import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';
import { AUDIT_ACTIONS } from '../../common/constants';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, params } = request;
    const user = (request as any).user;

    const action = this.mapMethodToAction(method);

    return next.handle().pipe(
      tap(response => {
        if (user && action) {
          this.eventEmitter.emit('audit.log', {
            action,
            userId: user.id,
            username: user.username,
            resource: this.extractResource(url),
            resourceId: params?.id || response?.data?.id,
            payload: method !== 'GET' ? this.sanitizePayload(body) : undefined,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            requestId: (request as any).requestId,
            timestamp: new Date(),
          });
        }
      }),
    );
  }

  private mapMethodToAction(method: string): string | null {
    const actionMap: Record<string, string> = {
      POST: AUDIT_ACTIONS.CREATE,
      GET: AUDIT_ACTIONS.READ,
      PUT: AUDIT_ACTIONS.UPDATE,
      PATCH: AUDIT_ACTIONS.UPDATE,
      DELETE: AUDIT_ACTIONS.DELETE,
    };
    return actionMap[method] || null;
  }

  private extractResource(url: string): string {
    const parts = url.split('/').filter(Boolean);
    const apiIndex = parts.findIndex(p => p === 'v1' || p === 'api');
    return apiIndex >= 0 ? parts[apiIndex + 1] : parts[0] || 'unknown';
  }

  private sanitizePayload(payload: any): any {
    if (!payload) return payload;
    const sanitized = { ...payload };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'refreshToken',
      'oldPassword',
      'newPassword',
    ];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) sanitized[field] = '[REDACTED]';
    });
    return sanitized;
  }
}
