import { defineConfig } from 'vite';

// Local development lives at `/`. GitHub project pages live at `/<repository>/`.
// VITE_BASE_PATH remains available for a custom domain or non-standard deployment.
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const githubPagesBase = process.env.GITHUB_ACTIONS === 'true' && repositoryName
  ? `/${repositoryName}/`
  : '/';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || githubPagesBase,
});
