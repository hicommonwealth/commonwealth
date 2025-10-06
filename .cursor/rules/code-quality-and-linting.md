# Rule: code-quality-and-linting

This rule outlines the procedures and tools used for maintaining code quality, including linting and type checking, within the Commonwealth repository.

**Key Tools & Commands:**

1.  **Type Checking (`pnpm -r check-types`)**:
    *   Uses `tsc --noEmit` recursively (`-r`) across packages.
    *   Catches standard TypeScript compilation errors (incorrect types, missing imports, etc.).
    *   Run from the **root** directory.

2.  **Strict Branch Linting (`pnpm lint-branch-warnings`)**:
    *   Runs the script `./scripts/lint-branch.sh` with `FAIL_WARNINGS=1`.
    *   Focuses on lint *warnings* and errors in files changed on the current branch compared to the base branch (`master` or the PR target).
    *   This is often the best command to run **locally** for iterative fixing, as it's stricter (includes warnings) and targets only relevant files.
    *   Run from the **root** directory.

3.  **Diff Linting (`pnpm -r run lint-diff`)**:
    *   Runs the `lint-diff` script recursively.
    *   Within the `packages/commonwealth` package, this executes `eslint` with a specific diff configuration (`../../.eslintrc-diff.cjs`) targeting specific directories (`client/`, `server/`, `scripts/`, `shared/`, `test/`).
    *   This seems to be a primary CI check that can fail the build based on errors *and* warnings in the targeted files (likely those changed in the PR).
    *   Run from the **root** directory.

4.  **Standard Branch Linting (`pnpm lint-branch`)**:
    *   Runs `./scripts/lint-branch.sh` *without* `FAIL_WARNINGS=1`.
    *   Likely checks only for lint *errors* (not warnings) in files changed on the current branch.
    *   Run from the **root** directory.

5.  **Broken `@ts-expect-error` Check (`cd packages/commonwealth && ./scripts/detect-broken-ts-expect-error.sh`)**:
    *   A specific script to find `@ts-expect-error` comments that are no longer necessary.
    *   Run from the `packages/commonwealth` directory.

**Workflow for Fixing Issues:**

1.  **Identify Errors:** Lint/type errors often surface in CI logs (e.g., from the `commonwealth-code-quality` job running `lint-diff` or `check-types`). Note that CI paths (`/home/runner/work/...`) differ from local paths.
2.  **Reproduce Locally:** Use `pnpm lint-branch-warnings` locally (from the root) to check the specific files changed in your branch. This often provides the clearest view of actionable issues. If type errors are reported, run `pnpm -r check-types`.
3.  **Address Issues Systematically:**
    *   **Unused Variables/Imports:** Remove them. Check if removing a variable usage necessitates removing its import (`@typescript-eslint/no-unused-vars`).
    *   **Type Errors:** Correct the types or use appropriate type guards. Avoid `any` (`@typescript-eslint/no-explicit-any`); prefer `unknown` with type checking or more specific types.
    *   **React Hook Rules:** Ensure hooks are called unconditionally at the top level and have correct dependencies (`react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`).
    *   **Rule Conflicts (e.g., Prettier vs. ESLint):** If rules conflict (like `max-len` vs. Prettier formatting), prefer disabling the less critical rule for specific lines using `// eslint-disable-next-line <rule-name>`. Avoid disabling rules globally unless necessary.
    *   **`prefer-const`:** Change `let` to `const` if a variable is never reassigned.
4.  **Verify Fixes:** Re-run the command used in step 2 (`pnpm lint-branch-warnings` or `pnpm -r check-types`) until it passes cleanly (exit code 0).
5.  **CI Discrepancies:** Be aware that CI logs might sometimes reflect issues that have already been fixed locally due to timing or caching. Always trust the local check (`lint-branch-warnings`) after making changes.

**Ignored Files (`packages/commonwealth/.eslintignore`):**

*   `node_modules`
*   `webpack` (Likely build output or configurations)

By following this workflow and using the appropriate commands, we can efficiently resolve linting and type-checking issues. 