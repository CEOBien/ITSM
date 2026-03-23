import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as any).requestId || uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = exceptionResponse.message || message;
        if (Array.isArray(exceptionResponse.message)) {
          errors = exceptionResponse.message.map((msg: string) => ({ message: msg }));
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.CONFLICT;
      const dbError = exception as any;

      if (dbError.code === '23505') {
        message = 'Dữ liệu đã tồn tại trong hệ thống';
        status = HttpStatus.CONFLICT;
      } else if (dbError.code === '23503') {
        message = 'Không thể thực hiện do ràng buộc dữ liệu';
        status = HttpStatus.CONFLICT;
      } else {
        message = 'Lỗi cơ sở dữ liệu';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `[${requestId}] ${request.method} ${request.url} - ${status}: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    });
  }
}
