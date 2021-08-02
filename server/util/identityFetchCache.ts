import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class IdentityFetchCache {
  private readonly _models;

  constructor(private readonly models) {
    this._models = models;
  }

  public async add(chain: string, address: string) {
    await this._models.IdentityCache.create({ chain, address });
    log.info(`${address} added to the identity cache`);
  }
}
