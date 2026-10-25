// Message keys under Auth.errors in messages/en.json.
export type AuthErrorKey =
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "linkExpired"
  | "rateLimited"
  | "weakPassword"
  | "generic";

// Supabase Auth error codes → what we tell the user. "invalid_credentials" covers both a wrong
// e-mail and a wrong password, so the message never reveals which accounts exist.
const keys: Record<string, AuthErrorKey> = {
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  otp_expired: "linkExpired",
  over_email_send_rate_limit: "rateLimited",
  over_request_rate_limit: "rateLimited",
  weak_password: "weakPassword",
};

export function authErrorKey(code: string | undefined): AuthErrorKey {
  return (code && keys[code]) || "generic";
}
