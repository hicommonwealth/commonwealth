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
        blockHash: {
          multi: callOverrides['blockHash.multi'],
        },
        events: {
          at: callOverrides['events.at'],
        }
      },
      democracy: {
        referendumInfoOf: callOverrides['referendumInfoOf'],
      }
    },
    derive: {
      chain: {
        bestNumber: callOverrides['bestNumber'],
      }
    }
  } as ApiPromise;
}
