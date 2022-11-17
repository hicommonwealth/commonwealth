import { StatsDController, StatsDTag } from 'common-common/src/statsd';
import { BalanceProvider } from 'token-balance-cache/src';

// Class with Helper functions to send statsD
export class TbcStatsDSender {
  private statsD = StatsDController.get(StatsDTag.TokenBalanceCache);

  // Log requests per provider + node + contract
  sendProviderInfo(bps: BalanceProvider[], nodeId?: number) {
    bps.forEach(bp => {
      const tags = {
        name: bp.name,
        nodeId: nodeId.toString(),
        contract: bp.opts['contract']
      }

      this.statsD.increment(`tbc.provider_requests`, tags)
    });
  }

  // Total cache size of 0 vs non-0 balance entries
  sendCacheSizeInfo({ zero, nonZero }) {
    this.statsD.gauge('tbc.cache_size_zero', zero);
    this.statsD.gauge('tbc.cache_size_nonzero', nonZero);
  }

  // Fetch timings per provider + node.
  sendFetchTiming(start: number, stop: number, name: string, nodeId: number) {
    const tags = {
      name: name,
      node: nodeId.toString()
    }

    this.statsD.timing('tbc.fetch_timings', stop - start, tags);
  }

  // Cache job items removed + timings
  sendJobItemRemoved(cacheKey: string) {
    const tags = {
      cacheKey: cacheKey,
      date: Date.now().toString()
    }

    this.statsD.increment('tbc.node_removed', tags);
  }

  // Failure counts + reasons
  sendAndThrowError(error: Error) {
    const tags = {
      reason: error.message
    }

    this.statsD.increment('tbc.error', tags);

    throw error;
  }
}