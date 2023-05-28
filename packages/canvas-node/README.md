## canvas-node

Canvas p2p node for Commonwealth.

### Running

- `npm run start` starts a Canvas node that connects to localhost:8080
- `npm run dev` starts a Canvas node that connects to localhost:8080, using the local development version of Canvas

The node automatically polls /api/oplog for new actions, and verifies
and executes them, inserting them into the CRDT database.

### Testing

- Start Commonwealth in packages/commonwealth: `yarn run start`
- Start Canvas node here in packages/canvas-node: `yarn run dev`
- As you make actions on different chains and communities,
  they should sync to the Canvas node.

Full specifcation for automated testing coming soon.
