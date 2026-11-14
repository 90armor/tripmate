/*
 * Application error categories (AGENT_RULES §55, ARCHITECTURE §37). Services
 * throw these; transport layers (Server Actions, pages, future /api/v1) map them
 * to form errors, not-found pages, or HTTP statuses. Messages are safe to show;
 * raw database errors never are.
 */

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Input failed validation. `fieldErrors` holds one message per invalid field. */
export class ValidationError extends AppError {
  readonly fieldErrors: Readonly<Partial<Record<string, string>>>;

  constructor(fieldErrors: Partial<Record<string, string>>, message = "Some details need fixing.") {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

/** No signed-in user. */
export class AuthenticationError extends AppError {
  constructor(message = "Sign in to continue.") {
    super(message);
  }
}

/** Signed in, and allowed to know the resource exists, but not to do this. */
export class AuthorizationError extends AppError {
  constructor(message = "You don’t have permission to do that.") {
    super(message);
  }
}

/**
 * The resource does not exist — or the user may not know it exists. Trip access
 * uses this for both, so responses never reveal another user's trip
 * (CURRENT_TASK §4.6).
 */
export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message);
  }
}

export class ConflictError extends AppError {}
