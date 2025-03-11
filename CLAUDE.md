# Commonwealth Codebase Reference

## Build/Lint/Test Commands
- Build: `pnpm build`
- Format: `pnpm format`
- Lint: `pnpm lint-branch` (changed files) or `pnpm lint-all` (all files)
- Unit tests: `pnpm test-unit` (all) or `pnpm test-select test/path/to/file.spec.ts` (specific)
- API tests: `pnpm test-api`
- E2E tests: `pnpm test-e2e`
- Check types: `pnpm check-types`
- Start development: `pnpm start`

## Code Style Guidelines
- Use TypeScript with strict typing (avoid `any` types)
- Format with Prettier (runs on pre-commit hook)
- Use arrow functions (`const x = () => {}` over `function x() {}`)
- Use TSDoc for public APIs and complex functions
- Follow RESTful API conventions for endpoints
- Use hexagonal architecture with controllers for business logic
- Handle promises properly: always use `await` or `.catch()`
- Error handling: use `formatErrorPretty` for user-facing errors
- Imports: use named imports, organize imports with Prettier
- Name files in `snake_case` for controllers/handlers
- Test files should follow `*.spec.ts` naming convention

## Repository Structure
- Monorepo with pnpm workspaces
- Core packages in `/libs/` (model, core, schemas, adapters)
- Main application in `/packages/commonwealth/`
- Server-side code in `server/` directory
- Client-side code in `client/` directory
- Documentation in `common_knowledge/`