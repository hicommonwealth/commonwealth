/**
 * This script "migrates" identities from the chain into the database, by first
 * querying all addresses, and then attempting to fetch corresponding identities
 * from the chain, writing the results back into the database.
 */

import { SubstrateTypes } from '@commonwealth/chain-events';

export async function migrateIdentities(models, chain?: string) {
  // TODO: query all valid chains for identity migrations, or query nodes for provided

  // TODO: query all addresses

  // TODO: connect to chain and query all identities

  // TODO: write identities back to db
}
