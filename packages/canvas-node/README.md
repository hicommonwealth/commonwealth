## canvas-node

Canvas p2p node for Commonwealth.

### Running

- `pnpm run start` starts a Canvas node that connects to localhost:8080
- `pnpm run dev` starts a Canvas node that connects to localhost:8080, using the local development version of Canvas

The node automatically polls /api/oplog for new actions, and verifies
and executes them, inserting them into the CRDT database.

### Testing

- Start Commonwealth in packages/commonwealth: `pnpm run start`
- Start Canvas node here in packages/canvas-node: `pnpm run dev`
- As you make actions on different chains and communities,
  they should sync to the Canvas node.

Full specifcation for automated testing coming soon.
