import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = uuidv4().substring(0, 8).toUpperCase();
    (request as any).requestId = requestId;

    const { method, url, ip } = request;
    const userAgent = request.headers['user-agent'] || '';
    const userId = (request as any).user?.id || 'anonymous';
    const now = Date.now();

    this.logger.log(
      `[${requestId}] ${method} ${url} - User: ${userId} - IP: ${ip} - UA: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const elapsed = Date.now() - now;
          this.logger.log(`[${requestId}] ${method} ${url} - ${statusCode} - ${elapsed}ms`);
        },
        error: error => {
          const elapsed = Date.now() - now;
          this.logger.error(
            `[${requestId}] ${method} ${url} - ERROR: ${error.message} - ${elapsed}ms`,
          );
        },
      }),
    );
  }
}
