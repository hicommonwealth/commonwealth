import type { ApiPromise } from '@polkadot/api';
import type {
  Event,
  ReferendumInfoTo239,
  AccountId,
  TreasuryProposal,
  Balance,
  PropIndex,
  Proposal,
  ReferendumIndex,
  ProposalIndex,
  VoteThreshold,
  Hash,
  BlockNumber,
  Extrinsic,
  ReferendumInfo,
  ValidatorId,
  Exposure,
  AuthorityId,
  IdentificationTuple,
  AccountVote,
  BountyIndex,
  BalanceOf,
} from '@polkadot/types/interfaces';
import type { Vec, Compact } from '@polkadot/types/codec';
import { Option } from '@polkadot/types/codec';
import type {
  bool,
  u32,
  u64,
  StorageKey,
  Bytes,
} from '@polkadot/types/primitive';
import type { Codec, AnyTuple } from '@polkadot/types/types';
import { hexToString } from '@polkadot/util';
import { filter } from 'lodash';
import type {
  Kind,
  OpaqueTimeSlot,
  OffenceDetails,
} from '@polkadot/types/interfaces/offences';

import type { CWEvent } from '../../../interfaces';
import { SupportedNetwork } from '../../../interfaces';
import type { IEventData, IdentityJudgement, ActiveExposure } from '../types';
import { EventKind, isEvent, parseJudgement } from '../types';
import { currentPoints } from '../utils/currentPoint';

export interface EnricherConfig {
  // if a balance transfer > (totalIssuance * balanceTransferThresholdPermill / 1_000_000)
  // then emit an event, otherwise do not emit for balance transfer.
  // Set to 0 or undefined to emit for all balance transfers.
  balanceTransferThresholdPermill?: number;
}

/**
 * This is an "enricher" function, whose goal is to augment the initial event data
 * received from the "system.events" query with additional useful information, as
 * described in the event's interface in our "types.ts" file.
 *
 * Once fetched, the function marshalls the event data and the additional information
 * into the interface, and returns a fully-formed event, ready for database storage.
 */

export async function Enrich(
  api: ApiPromise,
  blockNumber: number,
  kind: EventKind,
  rawData: Event | Extrinsic,
  config: EnricherConfig = {}
): Promise<CWEvent<IEventData>> {
  const extractEventData = async (
    event: Event
  ): Promise<{
    data: IEventData;
    includeAddresses?: string[];
    excludeAddresses?: string[];
  }> => {
    switch (kind) {
      case EventKind.BalanceTransfer: {
        const [sender, dest, value] = event.data as unknown as [
          AccountId,
          AccountId,
          Balance
        ] &
          Codec;

        // TODO: we may want to consider passing a hard threshold rather than recomputing it every
        //   time, in order to save on queries for chains with a large amount of transfers.
        const totalIssuance = await api.query.balances.totalIssuance();

        // only emit to everyone if transfer is 0 or above the configuration threshold
        const shouldEmitToAll =
          !config.balanceTransferThresholdPermill ||
          value
            .muln(1_000_000)
            .divn(config.balanceTransferThresholdPermill)
            .gte(totalIssuance);

        // skip this event if the transfer value isn't above the threshold
        if (!shouldEmitToAll) return null;

        // should not notify sender or recipient
        const excludeAddresses = [sender.toString(), dest.toString()];

        return {
          excludeAddresses,
          data: {
            kind,
            sender: sender.toString(),
            dest: dest.toString(),
            value: value.toString(),
          },
        };
      }

      /**
       * ImOnline Events
       */
      case EventKind.HeartbeatReceived: {
        const [authorityId] = event.data as unknown as [AuthorityId] & Codec;
        return {
          data: {
            kind,
            authorityId: authorityId.toString(),
          },
        };
      }

      case EventKind.SomeOffline: {
        const hash = await api.rpc.chain.getBlockHash(blockNumber);
        const sessionIndex = await api.query.session.currentIndex.at(hash);
        const [validators] = event.data as unknown as [
          Vec<IdentificationTuple>
        ];
        return {
          data: {
            kind,
            sessionIndex: +sessionIndex - 1,
            validators: validators?.map((v) => v.toString()),
          },
        };
      }
      case EventKind.AllGood: {
        const hash = await api.rpc.chain.getBlockHash(blockNumber);
        const sessionIndex = await api.query.session.currentIndex.at(hash);
        const validators = await api.query.session.validators.at(hash);
        return {
          data: {
            kind,
            sessionIndex: +sessionIndex - 1,
            validators: validators?.map((v) => v.toString()),
          },
        };
      }

      /**
       * Offences Events
       */
      case EventKind.Offence: {
        const [offenceKind, opaqueTimeSlot, applied] =
          event.data as unknown as [Kind, OpaqueTimeSlot, bool];
        const reportIds = await api.query.offences.concurrentReportsIndex(
          offenceKind,
          opaqueTimeSlot
        );
        const offenceDetails: Option<OffenceDetails>[] =
          await api.query.offences.reports.multi(reportIds);

        const allOffenders: Array<ValidatorId> = offenceDetails.map(
          (offence) => {
            return offence.isSome ? offence.unwrap().offender[0] : null;
          }
        );
        const offenders: Array<ValidatorId> = filter(allOffenders, null);
        return {
          data: {
            kind,
            offenceKind: offenceKind.toString(),
            opaqueTimeSlot: opaqueTimeSlot.toString(),
            applied: applied?.isTrue,
            offenders: offenders.map((offender) => offender.toString()),
          },
        };
      }
      /**
       * Session Events
       */
      case EventKind.NewSession: {
        const hash = await api.rpc.chain.getBlockHash(blockNumber);
        const sessionIndex = await api.query.session.currentIndex.at(hash);
        const validators = await api.query.session.validators.at(hash);

        // get era of current block
        const rawCurrentEra = await api.query.staking.currentEra.at(hash);
        const currentEra =
          rawCurrentEra instanceof Option
            ? rawCurrentEra.unwrap()
            : rawCurrentEra;

        // get the nextElected Validators
        const keys: StorageKey<AnyTuple>[] = api.query.staking.erasStakers
          ? // for version >= 38
            await api.query.staking.erasStakers.keysAt(hash, currentEra)
          : // for version = 31
            await api.query.staking.stakers.keysAt(hash);

        const nextElected =
          keys?.length > 0
            ? keys.map((key) => key.args[key.args.length - 1].toString())
            : validators.map((v) => v.toString());

        // get current stashes
        const stashes = await api.query.staking.validators.keysAt(hash);

        // find waiting validators
        const stashesStr = stashes
          .filter((v) => v.args.length > 0)
          .map((v) => v.args[0].toString());
        const waiting = stashesStr.filter((v) => !nextElected.includes(v));

        // get validators current era reward points
        const validatorEraPoints = await currentPoints(
          api,
          currentEra,
          hash,
          validators
        );

        // populate per-validator information
        const validatorInfo = {};
        for (const validator of validators) {
          const key = validator.toString();

          // get commissions
          const preference = api.query.staking.erasValidatorPrefs
            ? // for version >= 38
              await api.query.staking.erasValidatorPrefs.at(
                hash,
                currentEra,
                key
              )
            : // for version == 31
              await api.query.staking.validators.at(hash, key);

          const commissionPer = (+preference.commission || 0) / 10_000_000;

          const rewardDestination = await api.query.staking.payee.at(hash, key);
          const controllerId = await api.query.staking.bonded.at(hash, key);

          validatorInfo[key] = {
            commissionPer,
            controllerId: controllerId.isSome
              ? controllerId.unwrap().toString()
              : key,
            rewardDestination,
            eraPoints: validatorEraPoints[key] ?? 0,
          };
        }

        // populate exposures
        const activeExposures: ActiveExposure = {};
        if (validators && currentEra) {
          // if currentEra isn't empty
          await Promise.all(
            validators.map(async (validator) => {
              const tmpExposure: Exposure = api.query.staking.erasStakers
                ? await api.query.staking.erasStakers.at(
                    hash,
                    currentEra,
                    validator
                  )
                : await api.query.staking.stakers.at(hash, validator);

              activeExposures[validator.toString()] = {
                own: +tmpExposure.own,
                total: +tmpExposure.total,
                others: tmpExposure.others.map((exp) => ({
                  who: exp.who.toString(),
                  value: exp.value.toString(),
                })),
              };
            })
          );
        }
        return {
          data: {
            kind,
            activeExposures,
            active: validators?.map((v) => v.toString()),
            waiting,
            sessionIndex: +sessionIndex,
            currentEra: +currentEra,
            validatorInfo,
          },
        };
      }

      /**
       * Staking Events
       */
      case EventKind.Reward: {
        if (event.data.typeDef[0].type === 'Balance') {
          // edgeware/old event
          const [amount] = event.data as unknown as [Balance, Balance] & Codec;
          return {
            data: {
              kind,
              amount: amount.toString(),
            },
          };
        }
        // kusama/new event
        const [validator, amount] = event.data as unknown as [
          AccountId,
          Balance
        ] &
          Codec;
        return {
          includeAddresses: [validator.toString()],
          data: {
            kind,
            validator: validator.toString(),
            amount: amount.toString(),
          },
        };
      }
      case EventKind.Slash: {
        const [validator, amount] = event.data as unknown as [
          AccountId,
          Balance
        ] &
          Codec;
        return {
          includeAddresses: [validator.toString()],
          data: {
            kind,
            validator: validator.toString(),
            amount: amount.toString(),
          },
        };
      }

      case EventKind.Bonded:
      case EventKind.Unbonded: {
        const hash = await api.rpc.chain.getBlockHash(blockNumber);
        const [stash, amount] = event.data as unknown as [AccountId, Balance] &
          Codec;
        const controllerOpt = await api.query.staking.bonded.at<
          Option<AccountId>
        >(hash, stash);
        if (!controllerOpt.isSome) {
          throw new Error(
            `could not fetch staking controller for ${stash.toString()}`
          );
        }
        return {
          includeAddresses: [stash.toString()],
          data: {
            kind,
            stash: stash.toString(),
            amount: amount.toString(),
            controller: controllerOpt.unwrap().toString(),
          },
        };
      }
      case EventKind.StakingElection: {
        const era = await api.query.staking.activeEra();
        const validators = await api.derive.staking.validators();
        return {
          data: {
            kind,
            era: +era,
            validators: validators.validators?.map((v) => v.toString()),
          },
        };
      }

      /**
       * Democracy Events
       */
      case EventKind.VoteDelegated: {
        const [who, target] = event.data as unknown as [AccountId, AccountId] &
          Codec;
        return {
          includeAddresses: [target.toString()],
          data: {
            kind,
            who: who.toString(),
            target: target.toString(),
          },
        };
      }

      case EventKind.DemocracyProposed: {
        const [proposalIndex, deposit] = event.data as unknown as [
          PropIndex,
          Balance
        ] &
          Codec;
        const props = await api.query.democracy.publicProps();
        const prop = props.find(
          (p) => p.length > 0 && +p[0] === +proposalIndex
        );
        if (!prop) {
          throw new Error(
            `could not fetch info for proposal ${+proposalIndex}`
          );
        }
        const [, hash, proposer] = prop;
        return {
          excludeAddresses: [proposer.toString()],
          data: {
            kind,
            proposalIndex: +proposalIndex,
            proposalHash: hash.toString(),
            deposit: deposit.toString(),
            proposer: proposer.toString(),
          },
        };
      }

      case EventKind.DemocracyTabled: {
        const [proposalIndex] = event.data as unknown as [
          PropIndex,
          Balance,
          Vec<AccountId>
        ] &
          Codec;
        return {
          data: {
            kind,
            proposalIndex: +proposalIndex,
          },
        };
      }

      case EventKind.DemocracyStarted: {
        const [referendumIndex, voteThreshold] = event.data as unknown as [
          ReferendumIndex,
          VoteThreshold
        ] &
          Codec;
        const infoOpt = await api.query.democracy.referendumInfoOf<
          Option<ReferendumInfoTo239 | ReferendumInfo>
        >(referendumIndex);
        if (!infoOpt.isSome) {
          throw new Error(
            `could not find info for referendum ${+referendumIndex}`
          );
        }
        if ((infoOpt.unwrap() as ReferendumInfo).isOngoing) {
          // kusama
          const info = infoOpt.unwrap() as ReferendumInfo;
          if (!info.isOngoing) {
            throw new Error(
              `kusama referendum ${+referendumIndex} not in ongoing state`
            );
          }
          return {
            data: {
              kind,
              referendumIndex: +referendumIndex,
              proposalHash: info.asOngoing.proposalHash.toString(),
              voteThreshold: voteThreshold.toString(),
              endBlock: +info.asOngoing.end,
            },
          };
        }
        // edgeware
        const info = infoOpt.unwrap() as ReferendumInfoTo239;
        return {
          data: {
            kind,
            referendumIndex: +referendumIndex,
            proposalHash: info.proposalHash.toString(),
            voteThreshold: voteThreshold.toString(),
            endBlock: +info.end,
          },
        };
      }

      case EventKind.DemocracyPassed: {
        const [referendumIndex] = event.data as unknown as [ReferendumIndex] &
          Codec;
        // dispatch queue -- if not present, it was already executed
        const dispatchQueue = await api.derive.democracy.dispatchQueue();
        const dispatchInfo = dispatchQueue.find(
          ({ index }) => +index === +referendumIndex
        );
        return {
          data: {
            kind,
            referendumIndex: +referendumIndex,
            dispatchBlock: dispatchInfo ? +dispatchInfo.at : null,
          },
        };
      }

      case EventKind.DemocracyNotPassed:
      case EventKind.DemocracyCancelled: {
        const [referendumIndex] = event.data as unknown as [ReferendumIndex] &
          Codec;
        return {
          data: {
            kind,
            referendumIndex: +referendumIndex,
          },
        };
      }

      case EventKind.DemocracyExecuted: {
        const [referendumIndex, executionOk] = event.data as unknown as [
          ReferendumIndex,
          bool
        ] &
          Codec;
        return {
          data: {
            kind,
            referendumIndex: +referendumIndex,
            executionOk: executionOk.isTrue,
          },
        };
      }

      /**
       * Preimage Events
       */
      case EventKind.PreimageNoted: {
        const [hash, noter] = event.data as unknown as [
          Hash,
          AccountId,
          Balance
        ] &
          Codec;
        const image = await api.derive.democracy.preimage(hash);
        if (!image || !image.proposal) {
          throw new Error(
            `could not find info for preimage ${hash.toString()}`
          );
        }
        return {
          excludeAddresses: [noter.toString()],
          data: {
            kind,
            proposalHash: hash.toString(),
            noter: noter.toString(),
            preimage: {
              method: image.proposal.method,
              section: image.proposal.section,
              args: image.proposal.args.map((a) => a.toString()),
            },
          },
        };
      }
      case EventKind.PreimageUsed: {
        const [hash, noter] = event.data as unknown as [
          Hash,
          AccountId,
          Balance
        ] &
          Codec;
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            noter: noter.toString(),
          },
        };
      }
      case EventKind.PreimageInvalid:
      case EventKind.PreimageMissing: {
        const [hash, referendumIndex] = event.data as unknown as [
          Hash,
          ReferendumIndex
        ] &
          Codec;
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            referendumIndex: +referendumIndex,
          },
        };
      }
      case EventKind.PreimageReaped: {
        const [hash, noter, , reaper] = event.data as unknown as [
          Hash,
          AccountId,
          Balance,
          AccountId
        ] &
          Codec;
        return {
          excludeAddresses: [reaper.toString()],
          data: {
            kind,
            proposalHash: hash.toString(),
            noter: noter.toString(),
            reaper: reaper.toString(),
          },
        };
      }

      /**
       * Tip Events
       */
      case EventKind.NewTip: {
        const [hash] = event.data as unknown as [Hash] & Codec;
        const tip = await api.query.tips.tips(hash);
        if (!tip.isSome) {
          throw new Error(`Could not find tip: ${hash.toString()}`);
        }
        const {
          reason: reasonHash,
          who,
          finder,
          deposit,
          findersFee,
        } = tip.unwrap();
        const reasonOpt = await api.query.tips.reasons(reasonHash);
        if (!reasonOpt.isSome) {
          throw new Error(
            `Could not find reason for tip: ${reasonHash.toString()}`
          );
        }
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            // TODO: verify this reason string unmarshals correctly
            reason: hexToString(reasonOpt.unwrap().toString()),
            who: who.toString(),
            finder: finder.toString(),
            deposit: deposit.toString(),
            findersFee: findersFee.valueOf(),
          },
        };
      }
      case EventKind.TipClosing: {
        const [hash] = event.data as unknown as [Hash] & Codec;
        const tip = await api.query.tips.tips(hash);
        if (!tip.isSome) {
          throw new Error(`Could not find tip: ${hash.toString()}`);
        }
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            closing: +tip.unwrap().closes.unwrap(),
          },
        };
      }
      case EventKind.TipClosed: {
        const [hash, accountId, balance] = event.data as unknown as [
          Hash,
          AccountId,
          Balance
        ] &
          Codec;
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            who: accountId.toString(),
            payout: balance.toString(),
          },
        };
      }
      case EventKind.TipRetracted: {
        const [hash] = event.data as unknown as [Hash] & Codec;
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
          },
        };
      }
      case EventKind.TipSlashed: {
        const [hash, accountId, balance] = event.data as unknown as [
          Hash,
          AccountId,
          Balance
        ] &
          Codec;
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            finder: accountId.toString(),
            deposit: balance.toString(),
          },
        };
      }

      /**
       * Treasury Events
       */
      case EventKind.TreasuryProposed: {
        const [proposalIndex] = event.data as unknown as [ProposalIndex] &
          Codec;
        const proposalOpt = await api.query.treasury.proposals<
          Option<TreasuryProposal>
        >(proposalIndex);

        if (!proposalOpt.isSome) {
          throw new Error(
            `could not fetch treasury proposal index ${+proposalIndex}`
          );
        }
        const proposal = proposalOpt.unwrap();
        return {
          excludeAddresses: [proposal.proposer.toString()],
          data: {
            kind,
            proposalIndex: +proposalIndex,
            proposer: proposal.proposer.toString(),
            value: proposal.value.toString(),
            beneficiary: proposal.beneficiary.toString(),
            bond: proposal.bond.toString(),
          },
        };
      }

      case EventKind.TreasuryAwarded: {
        const [proposalIndex, amount, beneficiary] = event.data as unknown as [
          ProposalIndex,
          Balance,
          AccountId
        ] &
          Codec;
        return {
          data: {
            kind,
            proposalIndex: +proposalIndex,
            value: amount.toString(),
            beneficiary: beneficiary.toString(),
          },
        };
      }

      case EventKind.TreasuryRejected: {
        const [proposalIndex] = event.data as unknown as [ProposalIndex] &
          Codec;
        return {
          data: {
            kind,
            proposalIndex: +proposalIndex,
          },
        };
      }

      /**
       * Elections Events
       */
      case EventKind.ElectionNewTerm: {
        const [newMembers] = event.data as unknown as [
          Vec<[AccountId, Balance] & Codec>
        ] &
          Codec;
        const section = api.query.electionsPhragmen
          ? 'electionsPhragmen'
          : 'elections';
        const allMembers = await api.query[section].members<
          Vec<[AccountId, Balance] & Codec>
        >();
        const round = await api.query[section].electionRounds<u32>();
        return {
          data: {
            kind,
            round: +round,
            newMembers: newMembers.map(([who]) => who.toString()),
            allMembers: allMembers.map(([who]) => who.toString()),
          },
        };
      }
      case EventKind.ElectionEmptyTerm: {
        const section = api.query.electionsPhragmen
          ? 'electionsPhragmen'
          : 'elections';
        const allMembers = await api.query[section].members<
          Vec<[AccountId, Balance] & Codec>
        >();
        const round = await api.query[section].electionRounds<u32>();
        return {
          data: {
            kind,
            round: +round,
            members: allMembers.map(([who]) => who.toString()),
          },
        };
      }
      case EventKind.ElectionMemberKicked:
      case EventKind.ElectionMemberRenounced: {
        const [who] = event.data as unknown as [AccountId] & Codec;
        return {
          data: {
            kind,
            who: who.toString(),
          },
        };
      }

      /**
       * TreasuryReward events
       */
      case EventKind.TreasuryRewardMinting: {
        const [pot, reward] = event.data as unknown as [
          Balance,
          Balance,
          BlockNumber
        ] &
          Codec;
        return {
          data: {
            kind,
            pot: pot.toString(),
            reward: reward.toString(),
          },
        };
      }
      case EventKind.TreasuryRewardMintingV2: {
        const [pot, , potAddress] = event.data as unknown as [
          Balance,
          BlockNumber,
          AccountId
        ] &
          Codec;
        return {
          data: {
            kind,
            pot: pot.toString(),
            potAddress: potAddress.toString(),
          },
        };
      }

      /**
       * Identity events
       */
      case EventKind.IdentitySet: {
        const [who] = event.data as unknown as [AccountId] & Codec;
        const registrationOpt = await api.query.identity.identityOf(who);
        if (!registrationOpt.isSome) {
          throw new Error(`unable to retrieve identity info`);
        }
        const { info, judgements: judgementInfo } = registrationOpt.unwrap();
        if (!info.display || !info.display.isRaw) {
          throw new Error(`no display name set`);
        }
        const displayName = info.display.asRaw.toUtf8();
        const judgements: [string, IdentityJudgement][] = [];
        if (judgementInfo.length > 0) {
          const registrars = await api.query.identity.registrars();
          judgements.push(
            ...judgementInfo.map(
              ([id, judgement]): [string, IdentityJudgement] => {
                const registrarOpt = registrars[+id];
                if (!registrarOpt || !registrarOpt.isSome) {
                  throw new Error(`invalid judgement!`);
                }
                return [
                  registrarOpt.unwrap().account.toString(),
                  parseJudgement(judgement),
                ];
              }
            )
          );
        }
        return {
          excludeAddresses: [who.toString()],
          data: {
            kind,
            who: who.toString(),
            displayName,
            judgements,
          },
        };
      }
      case EventKind.IdentityCleared: {
        const [who] = event.data as unknown as [AccountId] & Codec;
        return {
          excludeAddresses: [who.toString()],
          data: {
            kind,
            who: who.toString(),
          },
        };
      }
      case EventKind.IdentityKilled: {
        const [who] = event.data as unknown as [AccountId] & Codec;
        return {
          data: {
            kind,
            who: who.toString(),
          },
        };
      }
      default: {
        throw new Error(`unknown event type: ${kind}`);
      }
    }
  };

  const extractExtrinsicData = async (
    extrinsic: Extrinsic
  ): Promise<{
    data: IEventData;
    includeAddresses?: string[];
    excludeAddresses?: string[];
  }> => {
    switch (kind) {
      case EventKind.DemocracySeconded: {
        const voter = extrinsic.signer.toString();
        const [proposal] = extrinsic.args as [Compact<PropIndex>];
        return {
          excludeAddresses: [voter],
          data: {
            kind,
            proposalIndex: +proposal,
            who: voter,
          },
        };
      }
      case EventKind.DemocracyVoted: {
        const voter = extrinsic.signer.toString();
        const [idx, vote] = extrinsic.args as [
          Compact<ReferendumIndex>,
          AccountVote
        ];
        if (vote.isSplit) {
          throw new Error(`split votes not supported`);
        }
        return {
          excludeAddresses: [voter],
          data: {
            kind,
            referendumIndex: +idx,
            who: voter,
            isAye: vote.asStandard.vote.isAye,
            conviction: vote.asStandard.vote.conviction.index,
            balance: vote.asStandard.balance.toString(),
          },
        };
      }
      case EventKind.TipVoted: {
        const voter = extrinsic.signer.toString();
        const [hash, value] = extrinsic.args as [Hash, Compact<BalanceOf>];
        return {
          data: {
            kind,
            proposalHash: hash.toString(),
            who: voter,
            value: value.toString(),
          },
        };
      }
      case EventKind.ElectionCandidacySubmitted: {
        const candidate = extrinsic.signer.toString();
        const section = api.query.electionsPhragmen
          ? 'electionsPhragmen'
          : 'elections';
        const round = await api.query[section].electionRounds<u32>();
        return {
          excludeAddresses: [candidate],
          data: {
            kind,
            round: +round,
            candidate,
          },
        };
      }
      default: {
        throw new Error(`unknown event type: ${kind}`);
      }
    }
  };

  const eventData = await (isEvent(rawData)
    ? extractEventData(rawData as Event)
    : extractExtrinsicData(rawData as Extrinsic));
  return eventData
    ? { ...eventData, blockNumber, network: SupportedNetwork.Substrate }
    : null;
}
