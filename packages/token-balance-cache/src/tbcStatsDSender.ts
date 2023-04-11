import { StatsDController, ProjectTag } from 'common-common/src/statsd';
import type { BalanceProvider } from './types';

// Class with Helper functions to send statsD
export class TbcStatsDSender {
  private statsD = StatsDController.get();

  // Log requests per provider + node + contract
  sendProviderInfo(bps: BalanceProvider<any>[], nodeId?: number) {
    bps.forEach((bp) => {
      const tags = {
        name: bp.name,
        nodeId: nodeId.toString(),
        contract: bp.opts['contract'],
        project: ProjectTag.TokenBalanceCache,
      };

      this.statsD.increment(`tbc.provider_requests`, tags);
    });
  }

  // Total cache size of 0 vs non-0 balance entries
  sendCacheSizeInfo({ zero, nonZero }) {
    const tags = {
      project: ProjectTag.TokenBalanceCache,
    };

    this.statsD.gauge('tbc.cache_size_zero', zero, tags);
    this.statsD.gauge('tbc.cache_size_nonzero', nonZero, tags);
  }

  // Fetch timings per provider + node.
  sendFetchTiming(start: number, stop: number, name: string, nodeId: number) {
    const tags = {
      name: name,
      node: nodeId.toString(),
      project: ProjectTag.TokenBalanceCache,
    };

    this.statsD.timing('tbc.fetch_timings', stop - start, tags);
  }

  // Cache job items removed + timings
  sendJobItemRemoved(cacheKey: string) {
    const tags = {
      cacheKey: cacheKey,
      date: Date.now().toString(),
      project: ProjectTag.TokenBalanceCache,
    };

    this.statsD.increment('tbc.node_removed', tags);
  }

  // Failure counts + reasons
  sendError(error: Error) {
    const tags = {
      reason: error.message,
      project: ProjectTag.TokenBalanceCache,
    };

    this.statsD.increment('tbc.error', tags);
  }
}
