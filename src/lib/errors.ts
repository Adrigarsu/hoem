// Typed errors with stable codes (docs/architecture.md §4.4). Services throw them; entry points map
// them to a form message or an RFC 9457 Problem Details body. Never put user data in a message.
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly status: number;
}

export class ValidationError extends AppError {
  readonly code = "validation_failed";
  readonly status = 422;
}

export class NotAuthenticatedError extends AppError {
  readonly code = "not_authenticated";
  readonly status = 401;
}

// Sign-up, sign-in or verification refused by Supabase Auth. `reason` is a message key, chosen so
// it never reveals whether an e-mail address has an account.
export class AuthFailedError extends AppError {
  readonly code = "auth_failed";
  readonly status = 401;

  constructor(readonly reason: string) {
    super(`Authentication failed: ${reason}`);
  }
}
