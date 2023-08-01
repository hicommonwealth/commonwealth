import { DB } from '../models';
import BanCache from '../util/banCheckCache';
import { TokenBalanceCache } from '../../../token-balance-cache/src';
import {
  SearchChainsOptions,
  SearchChainsResult,
  __searchChains,
} from './server_chains_methods/search_chains';

/**
 * Implements methods related to chains
 */
export class ServerChainsController {
  constructor(
    public models: DB,
    public tokenBalanceCache: TokenBalanceCache,
    public banCache: BanCache
  ) {}

  async searchChains(
    options: SearchChainsOptions
  ): Promise<SearchChainsResult> {
    return __searchChains.call(this, options);
  }
}
