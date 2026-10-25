import { Plus_Jakarta_Sans } from "next/font/google";

// next/font downloads the font at build time and serves it from our own domain, so visitors'
// browsers never contact Google (GDPR).
export const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});
