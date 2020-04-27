/* eslint-disable dot-notation */
import { ApiPromise } from '@polkadot/api';
import { Option } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';

export function constructOption<T extends Codec>(value?: T): Option<T> {
  if (value) {
    return {
      isSome: true,
      isNone: false,
      isEmpty: false,
      value,
      unwrap: () => value,
    } as unknown as Option<T>;
  } else {
    return {
      isSome: false,
      isNone: true,
      isEmpty: true,
      value: undefined,
      unwrap: () => { throw new Error('option is null'); }
    } as unknown as Option<T>;
  }
}

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
      },
      treasury: {
        proposals: callOverrides['proposals'],
      },
      council: {
        voting: callOverrides['voting'],
      },
      signaling: {
        proposalOf: callOverrides['proposalOf'],
      }
    },
    derive: {
      chain: {
        bestNumber: callOverrides['bestNumber'],
      },
      democracy: {
        dispatchQueue: callOverrides['dispatchQueue'],
      }
    }
  } as ApiPromise;
}
