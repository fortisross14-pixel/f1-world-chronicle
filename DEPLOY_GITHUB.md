# Deploying F1 World Chronicle to GitHub Pages

The project must be placed at the **repository root**. `package.json`, `vite.config.js`, `src/`, `public/`, and `.github/` must not sit inside another folder.

1. Push this project to the repository's `main` branch.
2. Open **Settings → Pages** in GitHub.
3. Set **Source** to **GitHub Actions**. Do not publish from `/docs`, the repository root, or an old `gh-pages` branch.
4. Open **Actions → Deploy F1 World Chronicle** and rerun the latest workflow when necessary.
5. After the deployment finishes, open the URL shown by the deployment and perform one hard refresh.

The Vite build uses `/<repository-name>/` only inside GitHub Actions, while localhost continues to use `/`. This prevents the hashed JavaScript and CSS files from being requested from the wrong domain root.

Seeing an old filename such as `index-B2Kgoyuv.css` after deploying this version means GitHub Pages or the browser is still serving the previous `index.html`. Confirm that Pages uses **GitHub Actions**, remove any old branch-based Pages deployment, rerun the workflow, and hard-refresh the browser.
