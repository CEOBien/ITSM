import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse } from '../../common/interfaces';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map(data => {
        if (data && data.success !== undefined) {
          return data;
        }

        let responseData = data;
        let meta: any = undefined;

        if (data && data.data !== undefined && data.meta !== undefined) {
          responseData = data.data;
          meta = data.meta;
        }

        return {
          success: true,
          statusCode,
          message: data?.message || this.getDefaultMessage(statusCode),
          data: data?.message ? undefined : responseData,
          meta,
          timestamp: new Date().toISOString(),
          path: request.url,
          requestId: (request as any).requestId,
        };
      }),
    );
  }

  private getDefaultMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      200: 'Thành công',
      201: 'Tạo mới thành công',
      204: 'Xóa thành công',
    };
    return messages[statusCode] || 'Thành công';
  }
}
