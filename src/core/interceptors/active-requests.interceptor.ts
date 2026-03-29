import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Tôn Ngộ Không — theo dõi số request đang xử lý và thống kê mỗi phút.
 * Counter dùng chung với MetricsCollectorService thông qua singleton này.
 * Được đăng ký global trong AppModule.
 */
@Injectable()
export class ActiveRequestsInterceptor implements NestInterceptor {
  private activeConnections = 0;

  /** Số request hoàn thành trong phút hiện tại */
  private requestsThisMinute = 0;
  /** Số response lỗi (status >= 400) trong phút hiện tại */
  private errorsThisMinute = 0;

  /** Snapshot cuối — được MetricsCollectorService đọc */
  private lastMinuteRequests = 0;
  private lastMinuteErrors = 0;

  constructor() {
    // Reset counter mỗi phút để lấy req/min
    setInterval(() => {
      this.lastMinuteRequests = this.requestsThisMinute;
      this.lastMinuteErrors = this.errorsThisMinute;
      this.requestsThisMinute = 0;
      this.errorsThisMinute = 0;
    }, 60_000);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Bỏ qua WebSocket context
    if (context.getType() !== 'http') {
      return next.handle();
    }

    this.activeConnections++;

    return next.handle().pipe(
      tap(() => {
        this.activeConnections = Math.max(0, this.activeConnections - 1);
        this.requestsThisMinute++;

        const response = context.switchToHttp().getResponse();
        if (response?.statusCode >= 400) {
          this.errorsThisMinute++;
        }
      }),
      catchError((err) => {
        this.activeConnections = Math.max(0, this.activeConnections - 1);
        this.requestsThisMinute++;
        this.errorsThisMinute++;
        return throwError(() => err);
      }),
    );
  }

  getActiveConnections(): number {
    return this.activeConnections;
  }

  getLastMinuteRequests(): number {
    return this.lastMinuteRequests;
  }

  getLastMinuteErrors(): number {
    return this.lastMinuteErrors;
  }
}
