import { ApiPromise } from '@polkadot/api';
import {
  Event, ReferendumInfoTo239, AccountId, TreasuryProposal, Balance, PropIndex,
  ReferendumIndex, ProposalIndex
} from '@polkadot/types/interfaces';
import { Option, bool } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';
import { SubstrateEventKind } from '../types';
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
  kind: SubstrateEventKind,
  event: Event,
): Promise<CWEvent> {
  const extractData = async (): Promise<CWEvent> => {
    switch (kind) {
      case SubstrateEventKind.Reward: {
        if (event.data.typeDef[0].type === 'Balance') {
          // edgeware/old event
          const [ amount, remainder ] = event.data as unknown as [ Balance, Balance ] & Codec;
          return {
            blockNumber,
            data: {
              kind,
              amount: amount.toString(),
            }
          };
        } else {
          // kusama/new event
          const [ validator, amount ] = event.data as unknown as [ AccountId, Balance ] & Codec;
          return {
            blockNumber,
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
          blockNumber,
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
          blockNumber,
          includeAddresses: [ stash.toString() ],
          data: {
            kind,
            stash: stash.toString(),
            amount: amount.toString(),
            controller: controllerOpt.unwrap().toString(),
          }
        };
      }

      case SubstrateEventKind.VoteDelegated: {
        const [ who, target ] = event.data as unknown as [ AccountId, AccountId ] & Codec;
        return {
          blockNumber,
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
          blockNumber,
          excludeAddresses: [ proposer.toString() ],
          data: {
            kind,
            proposalIndex: +proposalIndex,
            deposit: deposit.toString(),
            proposer: proposer.toString(),
          }
        };
      }

      case SubstrateEventKind.DemocracyStarted: {
        const [ referendumIndex ] = event.data as unknown as [ ReferendumIndex ] & Codec;

        // query for edgeware only -- kusama has different type
        const info = await api.query.democracy.referendumInfoOf<Option<ReferendumInfoTo239>>(referendumIndex);
        return {
          blockNumber,
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
          blockNumber,
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
          blockNumber,
          data: {
            kind,
            referendumIndex: +referendumIndex,
          }
        };
      }

      case SubstrateEventKind.DemocracyExecuted: {
        const [ referendumIndex, executionOk ] = event.data as unknown as [ ReferendumIndex, bool ] & Codec;
        return {
          blockNumber,
          data: {
            kind,
            referendumIndex: +referendumIndex,
            executionOk: executionOk.isTrue,
          }
        };
      }

      case SubstrateEventKind.TreasuryProposed: {
        const [ proposalIndex ] = event.data as unknown as [ ProposalIndex ] & Codec;
        const proposalOpt = await api.query.treasury.proposals<Option<TreasuryProposal>>(proposalIndex);
        if (!proposalOpt.isSome) {
          throw new Error(`could not fetch treasury proposal index ${+proposalIndex}`);
        }
        const proposal = proposalOpt.unwrap();
        return {
          blockNumber,
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
          blockNumber,
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
          blockNumber,
          data: {
            kind,
            proposalIndex: +proposalIndex,
          }
        };
      }

      default:
        throw new Error('unknown event type');
    }
  };

  // construct CWEvent
  const eventData = await extractData();
  return { ...eventData, blockNumber };
}
