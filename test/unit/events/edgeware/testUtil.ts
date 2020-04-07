/* eslint-disable dot-notation */
import { ApiPromise } from '@polkadot/api';

export function constructFakeApi(callOverrides): ApiPromise {
  return {
    rpc: {
      chain: {
        subscribeNewHeads: callOverrides['subscribeNewHeads'],
        getHeader: callOverrides['getHeader'],
      }
    },
    query: {
      system: {
        events: {
          at: callOverrides['events.at'],
        }
      }
    },
    derive: {
      chain: {
        bestNumber: callOverrides['bestNumber'],
      }
    }
  } as ApiPromise;
}
