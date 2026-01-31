import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An internal server error occurred';

    // The driverError property contains the database-specific error.
    // For PostgreSQL, this is where the error code (e.g., '22P02') is located.
    const driverError = exception.driverError as { code?: string };

    // Check for PostgreSQL's invalid UUID syntax error (code 22P02)
    if (driverError?.code === '22P02') {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Invalid input syntax for type UUID.';
    }

    response.status(statusCode).json({
      statusCode: statusCode,
      message: message,
      error: HttpStatus[statusCode],
    });
  }
}
