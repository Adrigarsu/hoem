import { currentHousehold } from "../current-household";
import { HouseholdMenu } from "./household-menu";

// Reads the active household, so it renders inside <Suspense> (cacheComponents). Someone who
// belongs to no household has nothing to switch.
export async function HouseholdSwitcher({ placement }: { placement: "header" | "sidebar" }) {
  const { active, households } = await currentHousehold();
  if (!active) return null;
  return <HouseholdMenu households={households} active={active} placement={placement} />;
}
