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
    createType: (name, value) => value,
    queryMulti: (queries) => {
      return Promise.all(queries.map((q: any[]) => {
        const qFunc = q[0];
        const qArgs = q.slice(1);
        return qFunc(...qArgs);
      }));
    },
    rpc: {
      chain: {
        subscribeNewHeads: callOverrides['subscribeNewHeads'],
        getHeader: callOverrides['getHeader'],
        getBlock: callOverrides['getBlock'],
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
      session: {
        currentIndex: callOverrides['currentIndex'],
      },
      democracy: {
        referendumInfoOf: callOverrides['referendumInfoOf'],
        publicProps: callOverrides['publicProps'],
        depositOf: callOverrides['depositOf'],
      },
      treasury: {
        proposals: callOverrides['treasuryProposals'],
      },
      council: {
        voting: callOverrides['voting'],
        proposalOf: callOverrides['collectiveProposalOf'],
      },
      signaling: {
        proposalOf: callOverrides['signalingProposalOf'],
        inactiveProposals: callOverrides['inactiveProposals'],
        activeProposals: callOverrides['activeProposals'],
        completedProposals: callOverrides['completedProposals'],
      },
      voting: {
        voteRecords: callOverrides['voteRecords'],
      },
    },
    derive: {
      chain: {
        bestNumber: callOverrides['bestNumber'],
      },
      democracy: {
        dispatchQueue: callOverrides['dispatchQueue'],
        preimage: callOverrides['preimage'],
        preimages: callOverrides['preimages'],
        referendumsActive: callOverrides['referendumsActive'],
      },
      treasury: {
        proposals: callOverrides['treasuryProposalsDerive'],
      },
      council: {
        proposals: callOverrides['councilProposalsDerive'],
      }
    }
  } as ApiPromise;
}
