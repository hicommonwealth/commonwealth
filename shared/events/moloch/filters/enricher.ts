import { hexToNumberString, hexToNumber as web3HexToNumber } from 'web3-utils';
import { CWEvent } from '../../interfaces';
import { MolochEventKind, MolochRawEvent, IMolochEventData, MolochApi } from '../types';
import { Moloch1 } from '../../../../eth/types/Moloch1';

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
export default async function (
  version: 1 | 2,
  api: MolochApi,
  blockNumber: number,
  kind: MolochEventKind,
  rawData: MolochRawEvent,
): Promise<CWEvent<IMolochEventData>> {
  switch (kind) {
    case MolochEventKind.SubmitProposal: {
      const {
        proposalIndex,
        delegateKey,
        memberAddress,
        applicant,
        tokenTribute,
        sharesRequested,
      } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [ memberAddress ],
        data: {
          kind,
          proposalIndex: hexToNumber(proposalIndex),
          delegateKey,
          member: memberAddress,
          applicant,
          tokenTribute: hexToString(tokenTribute),
          sharesRequested: hexToString(sharesRequested),
        }
      };
    }
    case MolochEventKind.SubmitVote: {
      const { proposalIndex, delegateKey, memberAddress, uintVote } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [ memberAddress ],
        data: {
          kind,
          proposalIndex: hexToNumber(proposalIndex),
          delegateKey,
          member: memberAddress,
          vote: uintVote,
        }
      };
    }
    case MolochEventKind.ProcessProposal: {
      const { proposalIndex, applicant, memberAddress, tokenTribute, sharesRequested, didPass } = rawData.args as any;
      return {
        blockNumber,
        data: {
          kind,
          proposalIndex: hexToNumber(proposalIndex),
          applicant,
          member: memberAddress,
          tokenTribute: hexToString(tokenTribute),
          sharesRequested: hexToString(sharesRequested),
          didPass,
        }
      };
    }
    case MolochEventKind.Ragequit: {
      const { memberAddress, sharesToBurn } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [ memberAddress ],
        data: {
          kind,
          member: memberAddress,
          sharesToBurn: hexToString(sharesToBurn),
        }
      };
    }
    case MolochEventKind.Abort: {
      const { proposalIndex, applicantAddress } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [ applicantAddress ],
        data: {
          kind,
          proposalIndex: hexToNumber(proposalIndex),
          applicant: applicantAddress,
        }
      };
    }
    case MolochEventKind.UpdateDelegateKey: {
      const { memberAddress, newDelegateKey } = rawData.args as any;
      return {
        blockNumber,
        // TODO: we only alert the new delegate that the key was changed
        //   ...is this correct?
        includeAddresses: [ newDelegateKey ],
        data: {
          kind,
          member: memberAddress,
          newDelegateKey,
        }
      };
    }
    case MolochEventKind.SummonComplete: {
      const { summoner, shares } = rawData.args as any;
      return {
        blockNumber,
        data: {
          kind,
          summoner,
          shares: hexToString(shares),
        }
      };
    }
    default: {
      throw new Error('unknown moloch event kind!');
    }
  }
}
