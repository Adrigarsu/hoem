import { CalendarDays, House, type LucideIcon } from "lucide-react";
import { moduleIcons } from "@/design-system";
import type { Destination } from "../domain/destinations";

// The modules keep the icons they have everywhere else.
export const destinationIcons: Record<Destination, LucideIcon> = {
  home: House,
  planner: CalendarDays,
  ...moduleIcons,
};
