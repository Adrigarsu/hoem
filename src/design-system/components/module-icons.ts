import { ShoppingCart, UtensilsCrossed, Wallet, type LucideIcon } from "lucide-react";

export type Module = "meals" | "shopping" | "expenses";

// One icon per module, wherever the module appears: chips, tiles and navigation.
export const moduleIcons: Record<Module, LucideIcon> = {
  meals: UtensilsCrossed,
  shopping: ShoppingCart,
  expenses: Wallet,
};
