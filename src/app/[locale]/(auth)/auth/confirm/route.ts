import { NextResponse, type NextRequest } from "next/server";
import { verifyEmailLink } from "@/features/auth";

// The link in the verification e-mail (supabase/templates/confirmation.html) lands here.
export async function GET(request: NextRequest) {
  const target = await verifyEmailLink(request.nextUrl.searchParams);
  return NextResponse.redirect(new URL(target, request.nextUrl.origin));
}
