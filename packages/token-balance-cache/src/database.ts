import { Client } from 'pg';

import { ChainNodeT } from './types';

const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;

export default async function fetchNodes(): Promise<{ [id: number]: ChainNodeT }> {
    // fetch node id map from database at startup
    const db = new Client({
      connectionString: DATABASE_URI,
      ssl: process.env.NODE_ENV !== 'production' ? false : {
        rejectUnauthorized: false,
      },
    });
    await db.connect();
    const nodeQuery = await db.query<ChainNodeT>(`SELECT * FROM "ChainNodes";`);
    const nodeArray = nodeQuery.rows;
    const nodes = {};
    for (const n of nodeArray) {
      nodes[n.id] = n;
    }
    await db.end();
    return nodes;
}
