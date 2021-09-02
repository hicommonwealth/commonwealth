import { DB } from '../database';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class IdentityFetchCache {
  constructor(private readonly _models: DB) { }

  public async add(chain: string, address: string) {
    await this._models.IdentityCache.create({ chain, address });
    log.info(`${address} added to the identity cache`);
  }
}
