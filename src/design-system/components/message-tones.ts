import { CircleAlert, CircleCheck, TriangleAlert, type LucideIcon } from "lucide-react";

// Shared by FormMessage and Toast. Errors and warnings interrupt (role=alert); confirmations wait
// for a pause in speech (role=status). The icon carries the meaning with the text, never colour
// alone (NFR-A11Y-005).
export const messageTones: Record<
  "danger" | "warning" | "success",
  { icon: LucideIcon; role: "alert" | "status" }
> = {
  danger: { icon: CircleAlert, role: "alert" },
  warning: { icon: TriangleAlert, role: "alert" },
  success: { icon: CircleCheck, role: "status" },
};

export type MessageTone = keyof typeof messageTones;
