import { themeScript } from "./theme";

// Blocks the first paint for a moment on purpose: this is what avoids a flash of the wrong theme.
// The content is a constant, with no user input in it.
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
