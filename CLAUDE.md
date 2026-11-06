# Working on this repo

This is a personal game the owner plays for fun on a tablet. It is not a
production product.

- When asked to push, push. Don't add gates, extra test rounds or checks
  first.
- Testing stays light: `npm run build` must pass, and fix real crashes or
  broken data. That's enough.
- Balance and simulation scripts are reports. They print numbers and
  never fail. Never make them assertions that block a commit, push or
  deploy, and never add new tests to `.github/workflows/deploy.yml`.
- Don't spend long tuning balance. Do one or two passes toward a target,
  report the numbers, and move on.
- Keep reports short. The owner reads on a phone.
