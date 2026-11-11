// The platform's errors: `Error(message)` in Nuclear is an AppError; a failed request is an HttpError.
export class AppError {
  constructor(
    readonly message: string = 'error',
    readonly status: number = 500,
  ) {}
}

/** A request that failed: a network error (`statusCode` 0) or a status the API answered. */
export class HttpError extends AppError {
  constructor(
    message: string,
    readonly statusCode: number = 0,
    readonly body: unknown = null,
  ) {
    super(message, statusCode || 500);
  }
}

/** A row or a value that is not there (a `find`, a `<method>AsLocal()` never answered). */
export class NotFound extends AppError {
  constructor(message = 'not found') {
    super(message, 404);
  }
}
