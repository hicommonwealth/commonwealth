import { ApiPromise } from '@polkadot/api';
import {
  Event, ReferendumInfoTo239, AccountId, TreasuryProposal, Balance, PropIndex,
  ReferendumIndex, ProposalIndex, VoteThreshold, Hash, BlockNumber, Votes,
} from '@polkadot/types/interfaces';
import { ProposalRecord } from 'edgeware-node-types/dist/types';
import { Option, bool, Vec, u32, u64 } from '@polkadot/types';
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
            proposalHash: hash.toString(),
            deposit: deposit.toString(),
            proposer: proposer.toString(),
          }
        };
      }

      case SubstrateEventKind.DemocracyTabled: {
        const [ proposalIndex ] = event.data as unknown as [ PropIndex, Balance, Vec<AccountId> ] & Codec;
        return {
          data: {
            kind,
            proposalIndex: +proposalIndex,
          }
        };
      }

      case SubstrateEventKind.DemocracyStarted: {
        const [ referendumIndex, voteThreshold ] = event.data as unknown as [ ReferendumIndex, VoteThreshold ] & Codec;

        // query for edgeware only -- kusama has different type
        const infoOpt = await api.query.democracy.referendumInfoOf<Option<ReferendumInfoTo239>>(referendumIndex);
        if (!infoOpt.isSome) {
          throw new Error(`could not find info for referendum ${+referendumIndex}`);
        }
        return {
          data: {
            kind,
            referendumIndex: +referendumIndex,
            proposalHash: infoOpt.unwrap().hash.toString(),
            voteThreshold: voteThreshold.toString(),
            endBlock: +infoOpt.unwrap().end,
          }
        };
      }

      case SubstrateEventKind.DemocracyPassed: {
        const [ referendumIndex ] = event.data as unknown as [ ReferendumIndex ] & Codec;
        // dispatch queue -- if not present, it was already executed
        const dispatchQueue = await api.derive.democracy.dispatchQueue();
        const dispatchInfo = dispatchQueue.find(({ index }) => +index === +referendumIndex);
        return {
          data: {
            kind,
            referendumIndex: +referendumIndex,
            dispatchBlock: dispatchInfo ? +dispatchInfo.at : null,
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
        const [ hash, noter, deposit ] = event.data as unknown as [ Hash, AccountId, Balance ] & Codec;
        return {
          excludeAddresses: [ noter.toString() ],
          data: {
            kind,
            proposalHash: hash.toString(),
            noter: noter.toString(),
          }
        };
      }
      case SubstrateEventKind.PreimageUsed: {
        const [ hash, noter, deposit ] = event.data as unknown as [ Hash, AccountId, Balance ] & Codec;
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            noter: noter.toString(),
          }
        };
      }
      case SubstrateEventKind.PreimageInvalid:
      case SubstrateEventKind.PreimageMissing: {
        const [ hash, referendumIndex ] = event.data as unknown as [ Hash, ReferendumIndex ] & Codec;
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            referendumIndex: +referendumIndex,
          }
        };
      }
      case SubstrateEventKind.PreimageReaped: {
        const [
          hash,
          noter,
          deposit,
          reaper,
        ] = event.data as unknown as [ Hash, AccountId, Balance, AccountId ] & Codec;
        return {
          excludeAddresses: [ reaper.toString() ],
          data: {
            kind,
            proposalHash: hash.toString(),
            noter: noter.toString(),
            reaper: reaper.toString(),
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
        const [ newMembers ] = event.data as unknown as [ Vec<[ AccountId, Balance ] & Codec> ] & Codec;
        return {
          data: {
            kind,
            newMembers: newMembers.map(([ who ]) => who.toString()),
          }
        };
      }
      case SubstrateEventKind.ElectionEmptyTerm: {
        return { data: { kind } };
      }
      case SubstrateEventKind.ElectionMemberKicked:
      case SubstrateEventKind.ElectionMemberRenounced: {
        const [ who ] = event.data as unknown as [ AccountId ] & Codec;
        return {
          data: {
            kind,
            who: who.toString(),
          }
        };
      }

      /**
       * Collective Events
       */
      case SubstrateEventKind.CollectiveProposed: {
        const [
          proposer,
          index,
          hash,
          threshold,
        ] = event.data as unknown as [ AccountId, ProposalIndex, Hash, u32 ] & Codec;
        return {
          excludeAddresses: [ proposer.toString() ],
          data: {
            kind,
            proposer: proposer.toString(),
            proposalIndex: +index,
            proposalHash: hash.toString(),
            threshold: +threshold,
          }
        };
      }
      case SubstrateEventKind.CollectiveApproved:
      case SubstrateEventKind.CollectiveDisapproved: {
        const [ hash ] = event.data as unknown as [ Hash ] & Codec;
        const infoOpt = await api.query.council.voting<Option<Votes>>(hash);
        if (!infoOpt.isSome) {
          throw new Error('could not fetch info for collective proposal');
        }
        const { index, threshold, ayes, nays } = infoOpt.unwrap();
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            proposalIndex: +index,
            threshold: +threshold,
            ayes: ayes.map((v) => v.toString()),
            nays: nays.map((v) => v.toString()),
          }
        };
      }
      case SubstrateEventKind.CollectiveExecuted:
      case SubstrateEventKind.CollectiveMemberExecuted: {
        const [ hash, executionOk ] = event.data as unknown as [ Hash, bool ] & Codec;
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            executionOk: executionOk.isTrue,
          }
        };
      }

      /**
       * Signaling Events
       */
      case SubstrateEventKind.SignalingNewProposal: {
        const [ proposer, hash ] = event.data as unknown as [ AccountId, Hash ] & Codec;
        const proposalInfoOpt = await api.query.signaling.proposalOf<Option<ProposalRecord>>(hash);
        if (!proposalInfoOpt.isSome) {
          throw new Error('unable to fetch signaling proposal info');
        }
        return {
          excludeAddresses: [ proposer.toString() ],
          data: {
            kind,
            proposer: proposer.toString(),
            proposalHash: hash.toString(),
            voteId: proposalInfoOpt.unwrap().vote_id.toString(),
            // TODO: add title/contents?
          }
        };
      }
      case SubstrateEventKind.SignalingCommitStarted:
      case SubstrateEventKind.SignalingVotingStarted: {
        const [ hash, voteId, endBlock ] = event.data as unknown as [ Hash, u64, BlockNumber ] & Codec;
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            voteId: voteId.toString(),
            endBlock: +endBlock,
          }
        };
      }
      case SubstrateEventKind.SignalingVotingCompleted: {
        const [ hash, voteId ] = event.data as unknown as [ Hash, u64 ] & Codec;
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            voteId: voteId.toString(),
          }
        };
      }

      /**
       * TreasuryReward events
       */
      case SubstrateEventKind.TreasuryRewardMinting: {
        const [ pot, reward, blockNum ] = event.data as unknown as [ Balance, Balance, BlockNumber ] & Codec;
        return {
          data: {
            kind,
            pot: pot.toString(),
            reward: reward.toString(),
          }
        };
      }
      case SubstrateEventKind.TreasuryRewardMintingV2: {
        const [ pot, blockNum, potAddress ] = event.data as unknown as [ Balance, BlockNumber, AccountId ] & Codec;
        return {
          data: {
            kind,
            pot: pot.toString(),
            potAddress: potAddress.toString(),
          }
        };
      }

      default: {
        // ensure exhaustive matching -- gives ts error if missing cases
        const _exhaustiveMatch: never = kind;
        throw new Error(`unknown event type: ${kind}`);
      }
    }
  };

  // construct CWEvent
  const eventData = await extractData();
  return { ...eventData, blockNumber };
}
