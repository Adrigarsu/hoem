import { NextResponse, type NextRequest } from "next/server";
import { endSessionHere } from "@/features/auth";

// Settings pages send a browser here when its session was signed out on another device.
export async function GET(request: NextRequest) {
  const target = await endSessionHere();
  return NextResponse.redirect(new URL(target, request.nextUrl.origin));
}
