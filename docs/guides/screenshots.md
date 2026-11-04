# Screenshots

Every pull request that adds or changes a page shows it at 360, 768 and 1440 px, in the light and
dark themes, next to its reference screen in `docs/design-system/screens/`.

## The app

```bash
pnpm app:capture <page> …
```

- Pages are paths without the leading slash; `home` is `/`. Add `--signed-in` for pages behind
  sign-in.
- It writes one collage per page to the ignored `screenshots/` folder. Never commit them: drag them
  into the pull request.
- It captures whatever answers on `APP_URL` (default port 3000). If that is an old server, build and
  serve a fresh one on another port (Playwright uses 3100):

  ```bash
  pnpm build
  pnpm start --port 3200
  APP_URL=http://localhost:3200 pnpm app:capture <page>
  ```

## The reference screens

`pnpm screens:capture` saves a full-page screenshot of every HTML design in
`docs/design-system/screens/` to `screenshots/`, each a board with its light, dark, mobile and
desktop frames side by side. `pnpm screens:capture sign-in` takes only the screens whose name
contains `sign-in`.
