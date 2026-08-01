# GitHub Actions: `vite: Permission denied`

The GitHub runner is Linux. If `node_modules` was ever uploaded or committed from
Windows, the generated `node_modules/.bin/vite` shim can lack Linux execute
permissions even though the same project builds locally.

This version prevents the problem in two ways:

1. The workflow deletes `node_modules` before installing dependencies on the runner.
2. `npm run build` invokes Vite with Node directly rather than executing the `.bin`
   shim.

The repository should still never track `node_modules`.

```bash
git rm -r --cached node_modules 2>/dev/null || true
git add .gitignore package.json .github/workflows/deploy.yml
git commit -m "Fix GitHub Vite build permissions"
git push
```

If Git reports that `node_modules` does not match any tracked files, that is fine.
