import { pendingSignUp } from "../pending-sign-up-cookie";
import { SignUpForm } from "./sign-up-form";

// Reads the sign-up made a moment ago, if any, so "Use a different email" keeps what was typed.
export async function SignUp() {
  const pending = await pendingSignUp();
  return <SignUpForm defaults={pending ?? undefined} />;
}
