import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId =
      (request.headers['x-correlation-id'] as string | undefined) ?? randomUUID();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse() as
        | string
        | {
            code?: string;
            message?: string | string[];
            details?: unknown[];
          };

      const message =
        typeof errorResponse === 'string'
          ? errorResponse
          : Array.isArray(errorResponse.message)
            ? errorResponse.message.join(', ')
            : (errorResponse.message ?? exception.message);

      const code =
        typeof errorResponse === 'string'
          ? this.mapStatusToCode(status)
          : (errorResponse.code ?? this.mapStatusToCode(status));

      response.status(status).json({
        code,
        message,
        details:
          typeof errorResponse === 'string' ? [] : (errorResponse.details ?? []),
        traceId,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_ERROR',
      message: 'Unexpected server error',
      details: [],
      traceId,
    });
  }

  private mapStatusToCode(status: number) {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
