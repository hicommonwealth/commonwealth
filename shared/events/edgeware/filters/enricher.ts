import { ApiPromise } from '@polkadot/api';
import {
  Event, ReferendumInfoTo239, AccountId, TreasuryProposal, Balance, PropIndex,
  ReferendumIndex, ProposalIndex
} from '@polkadot/types/interfaces';
import { Option, bool } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';
import { SubstrateEventKind, ISubstrateEventData } from '../types';
import { CWEvent } from '../../interfaces';

/**
 * This is an "enricher" function, whose goal is to augment the initial event data
 * received from the "system.events" query with additional useful information, as
 * described in the event's interface in our "types.ts" file.
 *
 * Once fetched, the function marshalls the event data and the additional information
 * into the interface, and returns a fully-formed event, ready for database storage.
 */
export default async function (
  api: ApiPromise,
  blockNumber: number,
  version: number,
  kind: SubstrateEventKind,
  event: Event,
): Promise<CWEvent> {
  const extractData = async (): Promise<{
    data: ISubstrateEventData,
    includeAddresses?: string[],
    excludeAddresses?: string[],
  }> => {
    switch (kind) {
      /**
       * Staking Events
       */
      case SubstrateEventKind.Reward: {
        if (event.data.typeDef[0].type === 'Balance') {
          // edgeware/old event
          const [ amount, remainder ] = event.data as unknown as [ Balance, Balance ] & Codec;
          return {
            data: {
              kind,
              amount: amount.toString(),
            }
          };
        } else {
          // kusama/new event
          const [ validator, amount ] = event.data as unknown as [ AccountId, Balance ] & Codec;
          return {
            includeAddresses: [ validator.toString() ],
            data: {
              kind,
              validator: validator.toString(),
              amount: amount.toString(),
            }
          };
        }
      }
      case SubstrateEventKind.Slash: {
        const [ validator, amount ] = event.data as unknown as [ AccountId, Balance ] & Codec;
        return {
          includeAddresses: [ validator.toString() ],
          data: {
            kind,
            validator: validator.toString(),
            amount: amount.toString(),
          }
        };
      }

      case SubstrateEventKind.Bonded:
      case SubstrateEventKind.Unbonded: {
        const [ stash, amount ] = event.data as unknown as [ AccountId, Balance ] & Codec;
        const controllerOpt = await api.query.staking.bonded<Option<AccountId>>(stash);
        if (!controllerOpt.isSome) {
          throw new Error(`could not fetch staking controller for ${stash.toString()}`);
        }
        return {
          includeAddresses: [ stash.toString() ],
          data: {
            kind,
            stash: stash.toString(),
            amount: amount.toString(),
            controller: controllerOpt.unwrap().toString(),
          }
        };
      }

      /**
       * Democracy Events
       */
      case SubstrateEventKind.VoteDelegated: {
        const [ who, target ] = event.data as unknown as [ AccountId, AccountId ] & Codec;
        return {
          includeAddresses: [ target.toString() ],
          data: {
            kind,
            who: who.toString(),
            target: target.toString(),
          }
        };
      }

      case SubstrateEventKind.DemocracyProposed: {
        const [ proposalIndex, deposit ] = event.data as unknown as [ PropIndex, Balance ] & Codec;
        const props = await api.query.democracy.publicProps();
        const prop = props.find((p) => p.length > 0 && +p[0] === +proposalIndex);
        if (!prop) {
          throw new Error(`could not fetch info for proposal ${+proposalIndex}`);
        }
        const [ idx, hash, proposer ] = prop;
        return {
          excludeAddresses: [ proposer.toString() ],
          data: {
            kind,
            proposalIndex: +proposalIndex,
            deposit: deposit.toString(),
            proposer: proposer.toString(),
          }
        };
      }

      case SubstrateEventKind.DemocracyTabled: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }

      case SubstrateEventKind.DemocracyStarted: {
        const [ referendumIndex ] = event.data as unknown as [ ReferendumIndex ] & Codec;

        // query for edgeware only -- kusama has different type
        const info = await api.query.democracy.referendumInfoOf<Option<ReferendumInfoTo239>>(referendumIndex);
        return {
          data: {
            kind,
            referendumIndex: +referendumIndex,
            endBlock: info.isSome ? (+info.unwrap().end) : null,
          }
        };
      }

      case SubstrateEventKind.DemocracyPassed: {
        const [ referendumIndex ] = event.data as unknown as [ ReferendumIndex ] & Codec;

        // dispatch queue -- if not present, it was already executed
        const dispatchQueue = await api.query.democracy.dispatchQueue();
        const dispatchInfo = dispatchQueue.find(([ block, hash, idx ]) => +idx === +referendumIndex);
        return {
          data: {
            kind,
            referendumIndex: +referendumIndex,
            dispatchBlock: dispatchInfo ? +dispatchInfo[0] : null,
          }
        };
      }

      case SubstrateEventKind.DemocracyNotPassed:
      case SubstrateEventKind.DemocracyCancelled: {
        const [ referendumIndex ] = event.data as unknown as [ ReferendumIndex ] & Codec;
        return {
          data: {
            kind,
            referendumIndex: +referendumIndex,
          }
        };
      }

      case SubstrateEventKind.DemocracyExecuted: {
        const [ referendumIndex, executionOk ] = event.data as unknown as [ ReferendumIndex, bool ] & Codec;
        return {
          data: {
            kind,
            referendumIndex: +referendumIndex,
            executionOk: executionOk.isTrue,
          }
        };
      }

      /**
       * Preimage Events
       */
      case SubstrateEventKind.PreimageNoted: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.PreimageInvalid: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.PreimageMissing: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.PreimageReaped: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }

      /**
       * Treasury Events
       */
      case SubstrateEventKind.TreasuryProposed: {
        const [ proposalIndex ] = event.data as unknown as [ ProposalIndex ] & Codec;
        const proposalOpt = await api.query.treasury.proposals<Option<TreasuryProposal>>(proposalIndex);
        if (!proposalOpt.isSome) {
          throw new Error(`could not fetch treasury proposal index ${+proposalIndex}`);
        }
        const proposal = proposalOpt.unwrap();
        return {
          excludeAddresses: [ proposal.proposer.toString() ],
          data: {
            kind,
            proposalIndex: +proposalIndex,
            proposer: proposal.proposer.toString(),
            value: proposal.value.toString(),
            beneficiary: proposal.beneficiary.toString(),
          }
        };
      }

      case SubstrateEventKind.TreasuryAwarded: {
        const [
          proposalIndex,
          amount,
          beneficiary,
        ] = event.data as unknown as [ ProposalIndex, Balance, AccountId ] & Codec;
        return {
          data: {
            kind,
            proposalIndex: +proposalIndex,
            value: amount.toString(),
            beneficiary: beneficiary.toString(),
          }
        };
      }

      case SubstrateEventKind.TreasuryRejected: {
        const [ proposalIndex, slashedBond ] = event.data as unknown as [ ProposalIndex, Balance ] & Codec;
        return {
          data: {
            kind,
            proposalIndex: +proposalIndex,
          }
        };
      }

      /**
       * Elections Events
       */
      case SubstrateEventKind.ElectionNewTerm: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.ElectionEmptyTerm: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.ElectionMemberKicked: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.ElectionMemberRenounced: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }

      /**
       * Collective Events
       */
      case SubstrateEventKind.CollectiveProposed: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.CollectiveApproved: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.CollectiveExecuted: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.CollectiveMemberExecuted: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }

      /**
       * Signaling Events
       */
      case SubstrateEventKind.SignalingNewProposal: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.SignalingCommitStarted: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.SignalingVotingStarted: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }
      case SubstrateEventKind.SignalingVotingCompleted: {
        // TODO
        return {
          data: {
            kind
          }
        };
      }

      default: {
        // ensure exhaustive matching -- gives ts error if missing cases
        const _exhaustiveMatch: never = kind;
        throw new Error('unknown event type');
      }
    }
  };

  // construct CWEvent
  const eventData = await extractData();
  return { ...eventData, version: version.toString(), blockNumber };
}
