# Cheat sheet

**Installation:**

- Yarn: `yarn install`
- PNPM: `pnpm install`

**Adding a Dependency:**

- Yarn: `yarn add <package>`
- PNPM: `pnpm add <package>`

**Adding a Dev Dependency:**

- Yarn: `yarn add --dev <package>`
- PNPM: `pnpm add --save-dev <package>`

**Removing a Dependency:**

- Yarn: `yarn remove <package>`
- PNPM: `pnpm remove <package>`

**Running a Script:**

- Yarn: `yarn <script>`
- PNPM: `pnpm <script>`

**Running a Script in a Specific Workspace:**

- Yarn: `yarn workspace <workspace_name> <script>`
- PNPM: `pnpm -r run <script> -- <workspace_name>`

**Adding a Workspace:**

- Yarn: Modify `package.json` to include a `workspaces` field with an array of workspace paths.
- PNPM: Modify `pnpm-workspace.yaml` to include a list of workspace paths.

**Installing Dependencies for All Workspaces:**

- Yarn: `yarn install`
- PNPM: `pnpm install --recursive`

**Installing Dependencies for Specific Workspaces:**

- Yarn: `yarn install --scope <workspace_name>`
- PNPM: `pnpm install --filter <workspace_name>`

**Listing Workspaces:**

- Yarn: `yarn workspaces list`
- PNPM: `pnpm -r list`

**Running a Command in All Workspaces:**

- Yarn: `yarn workspaces foreach <command>`
- PNPM: `pnpm recursive <command>`

**Running a Command in Specific Workspaces:**

- Yarn: `yarn workspaces run <command> --scope <workspace_name>`
- PNPM: `pnpm -r run <command> --filter <workspace_name>`

**Linking Workspaces:**

- Yarn: Automatically linked.
- PNPM: Automatically linked.

**Cleaning Cache:**

- Yarn: `yarn cache clean`
- PNPM: `pnpm store prune`

**Viewing Dependency Tree:**

- Yarn: `yarn list --depth=0`
- PNPM: `pnpm list --depth=0`

Remember to consult PNPM's documentation for any additional functionalities or specific use cases!
