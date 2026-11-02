// The pages the profile and settings menu opens (FR-NAV-003, profile.md).
export const settingsPaths = {
  settings: "/settings",
  // Coming soon until their issue builds them: Account and Appearance (#22), Delete account
  // (#23), Notifications (M5) and Download my data (NFR-LEG-003).
  account: "/settings/account",
  appearance: "/settings/appearance",
  notifications: "/settings/notifications",
  downloadData: "/settings/download-data",
  deleteAccount: "/settings/delete-account",
} as const;
