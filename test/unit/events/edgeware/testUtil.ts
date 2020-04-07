import { ApiPromise } from '@polkadot/api';

/* eslint-disable dot-notation */
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
