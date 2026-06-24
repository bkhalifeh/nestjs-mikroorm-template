import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import type { Request } from 'express';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

/**
 * Catches every unhandled exception, normalizes it to a single response shape,
 * logs it, and hides internal details for 5xx errors.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[];
    let error: string;

    if (isHttp) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
        error = exception.name;
      } else {
        const body = response as Record<string, unknown>;
        message = (body['message'] as string | string[]) ?? exception.message;
        error = (body['error'] as string) ?? exception.name;
      }
    } else {
      // Never leak internal error details to the client on 5xx.
      message = 'Internal server error';
      error = 'InternalServerError';
    }

    if (status >= 500) {
      this.logger.error(
        { err: exception, path: request.url, method: request.method },
        'Unhandled exception',
      );
    } else {
      this.logger.warn(
        { path: request.url, method: request.method, status },
        typeof message === 'string' ? message : message.join(', '),
      );
    }

    const body: ErrorBody = {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    httpAdapter.reply(ctx.getResponse(), body, status);
  }
}
