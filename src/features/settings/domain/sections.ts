// The pages the profile and settings menu opens (FR-NAV-003, profile.md).
export const settingsPaths = {
  settings: "/settings",
  // Phones edit these on their own page; wider screens edit them in the cards of /settings.
  account: "/settings/account",
  appearance: "/settings/appearance",
  language: "/settings/language",
  // Coming soon until their issue builds them: Delete account (#23), Notifications (M5) and
  // Download my data (NFR-LEG-003).
  notifications: "/settings/notifications",
  downloadData: "/settings/download-data",
  deleteAccount: "/settings/delete-account",
} as const;
