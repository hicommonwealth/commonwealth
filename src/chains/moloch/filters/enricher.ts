/* eslint-disable @typescript-eslint/no-explicit-any */
import { Contract } from 'ethers';
import { hexToNumberString, hexToNumber as web3HexToNumber } from 'web3-utils';

import { TypedEventFilter } from '../../../contractTypes/commons';
import { Moloch1 } from '../../../contractTypes';
import { CWEvent, SupportedNetwork } from '../../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';

type GetEventArgs<T> = T extends TypedEventFilter<any, infer Y> ? Y : never;
type GetArgType<
  C extends Contract,
  Name extends keyof C['filters']
> = GetEventArgs<ReturnType<C['filters'][Name]>>;

// these functions unwrap the uint type received from chain,
// which is an object like { _hex: <value> }, into a string/number
function hexToString({ _hex: n }: { _hex: string }): string {
  return hexToNumberString(n);
}

function hexToNumber({ _hex: n }: { _hex: string }): number {
  return web3HexToNumber(n);
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
  version: 1 | 2,
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent,
  chain?: string
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.SubmitProposal: {
      const {
        proposalIndex,
        delegateKey,
        memberAddress,
        applicant,
        tokenTribute,
        sharesRequested,
      } = rawData.args as GetArgType<Moloch1, 'SubmitProposal'>;
      // TODO: pull these out into class, perhaps
      const proposal = await (api as Moloch1).proposalQueue(proposalIndex);
      const startingPeriod = +proposal.startingPeriod;
      const { details } = proposal;
      const periodDuration = +(await api.periodDuration());
      const summoningTime = +(await api.summoningTime());
      return {
        blockNumber,
        excludeAddresses: [memberAddress],
        network: SupportedNetwork.Moloch,
        data: {
          kind,
          proposalIndex: hexToNumber(proposalIndex),
          delegateKey,
          member: memberAddress,
          applicant,
          tokenTribute: hexToString(tokenTribute),
          sharesRequested: hexToString(sharesRequested),
          details,
          startTime: summoningTime + startingPeriod * periodDuration,
        },
      };
    }
    case EventKind.SubmitVote: {
      const {
        proposalIndex,
        delegateKey,
        memberAddress,
        uintVote,
      } = rawData.args as GetArgType<Moloch1, 'SubmitVote'>;
      const member = await (api as Moloch1).members(memberAddress);
      return {
        blockNumber,
        excludeAddresses: [memberAddress],
        network: SupportedNetwork.Moloch,
        data: {
          kind,
          proposalIndex: hexToNumber(proposalIndex),
          delegateKey,
          member: memberAddress,
          vote: uintVote,
          shares: member.shares.toString(),
          highestIndexYesVote: +member.highestIndexYesVote,
        },
      };
    }
    case EventKind.ProcessProposal: {
      const {
        proposalIndex,
        applicant,
        memberAddress,
        tokenTribute,
        sharesRequested,
        didPass,
      } = rawData.args as GetArgType<Moloch1, 'ProcessProposal'>;
      const proposal = await (api as Moloch1).proposalQueue(proposalIndex);
      return {
        blockNumber,
        network: SupportedNetwork.Moloch,
        data: {
          kind,
          proposalIndex: hexToNumber(proposalIndex),
          applicant,
          member: memberAddress,
          tokenTribute: hexToString(tokenTribute),
          sharesRequested: hexToString(sharesRequested),
          didPass,
          yesVotes: proposal.yesVotes.toString(),
          noVotes: proposal.noVotes.toString(),
        },
      };
    }
    case EventKind.Ragequit: {
      const { memberAddress, sharesToBurn } = rawData.args as GetArgType<
        Moloch1,
        'Ragequit'
      >;
      return {
        blockNumber,
        excludeAddresses: [memberAddress],
        network: SupportedNetwork.Moloch,
        data: {
          kind,
          member: memberAddress,
          sharesToBurn: hexToString(sharesToBurn),
        },
      };
    }
    case EventKind.Abort: {
      const { proposalIndex, applicantAddress } = rawData.args as GetArgType<
        Moloch1,
        'Abort'
      >;
      return {
        blockNumber,
        excludeAddresses: [applicantAddress],
        network: SupportedNetwork.Moloch,
        data: {
          kind,
          proposalIndex: hexToNumber(proposalIndex),
          applicant: applicantAddress,
        },
      };
    }
    case EventKind.UpdateDelegateKey: {
      const { memberAddress, newDelegateKey } = rawData.args as GetArgType<
        Moloch1,
        'UpdateDelegateKey'
      >;
      return {
        blockNumber,
        // TODO: we only alert the new delegate that the key was changed
        //   ...is this correct?
        includeAddresses: [newDelegateKey],
        network: SupportedNetwork.Moloch,
        data: {
          kind,
          member: memberAddress,
          newDelegateKey,
        },
      };
    }
    case EventKind.SummonComplete: {
      const { summoner, shares } = rawData.args as GetArgType<
        Moloch1,
        'SummonComplete'
      >;
      return {
        blockNumber,
        network: SupportedNetwork.Moloch,
        data: {
          kind,
          summoner,
          shares: hexToString(shares),
        },
      };
    }
    default: {
      throw new Error(
        `[${SupportedNetwork.Moloch}${
          chain ? `::${chain}` : ''
        }]: Unknown event kind!`
      );
    }
  }
}
