/* eslint-disable dot-notation */
import { ApiPromise } from '@polkadot/api';

export function constructFakeApi(callOverrides): ApiPromise {
  return {
    rpc: {
      chain: {
        subscribeNewHeads: callOverrides['subscribeNewHeads'],
        getHeader: callOverrides['getHeader'],
      },
      state: {
        getRuntimeVersion: callOverrides['getRuntimeVersion'],
        subscribeRuntimeVersion: callOverrides['subscribeRuntimeVersion'],
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
      staking: {
        bonded: callOverrides['bonded'],
      },
      democracy: {
        referendumInfoOf: callOverrides['referendumInfoOf'],
        publicProps: callOverrides['publicProps'],
      }
    },
    derive: {
      chain: {
        bestNumber: callOverrides['bestNumber'],
      }
    }
  } as ApiPromise;
}
