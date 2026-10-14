# GitHub Pages

Preview URL after the workflow succeeds: https://kcng0.github.io/ui-resource-lab/

- Build runs on pull requests, on `main`, and on `cursor/scaffold-browse-app-5460`
- Deploy runs only for `refs/heads/main`
- Sets Vite `base` to `/ui-resource-lab/` via `GITHUB_PAGES=true`
- Copies `index.html` to `404.html` so React Router deep links work

Repo Settings → Pages → Source must be **GitHub Actions** (first successful deploy usually enables it).
