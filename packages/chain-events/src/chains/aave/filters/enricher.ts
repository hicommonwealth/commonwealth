/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BigNumber } from 'ethers';

import type { TypedEventFilter } from '../../../contractTypes/commons';
import type { AaveTokenV2, IAaveGovernanceV2 } from '../../../contractTypes';
import type { CWEvent } from '../../../interfaces';
import { SupportedNetwork } from '../../../interfaces';
import type { RawEvent, IEventData, Api } from '../types';
import { EventKind } from '../types';

type GetEventArgs<T> = T extends TypedEventFilter<any, infer Y> ? Y : never;
type GetArgType<Name extends keyof IAaveGovernanceV2['filters']> = GetEventArgs<
  ReturnType<IAaveGovernanceV2['filters'][Name]>
>;
type GetTokenArgType<Name extends keyof AaveTokenV2['filters']> = GetEventArgs<
  ReturnType<AaveTokenV2['filters'][Name]>
>;

export async function Enrich(
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent | Omit<RawEvent, 'name'> // omit name for backwards compatibility with StorageFetcher
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.ProposalCanceled: {
      const { id } = rawData.args as GetArgType<'ProposalCanceled'>;
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Aave,
        data: {
          kind,
          id: +id,
        },
      };
    }
    case EventKind.ProposalCreated: {
      const {
        id,
        creator,
        executor,
        targets,
        signatures,
        calldatas,
        startBlock,
        endBlock,
        strategy,
        ipfsHash,
      } = rawData.args as GetArgType<'ProposalCreated'>;

      // values doesn't appear on the object version, hack around it by accessing the
      // argument array instead
      const values = rawData.args[4] as BigNumber[];

      return {
        blockNumber,
        excludeAddresses: [creator],
        network: SupportedNetwork.Aave,
        data: {
          kind,
          id: +id,
          proposer: creator,
          executor,
          targets,
          values: values.map((v) => v.toString()),
          signatures,
          calldatas,
          startBlock: +startBlock,
          endBlock: +endBlock,
          strategy,
          ipfsHash,
        },
      };
    }
    case EventKind.ProposalExecuted: {
      const { id } = rawData.args as GetArgType<'ProposalExecuted'>;
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Aave,
        data: {
          kind,
          id: +id,
        },
      };
    }
    case EventKind.ProposalQueued: {
      const { id, executionTime } =
        rawData.args as GetArgType<'ProposalQueued'>;
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Aave,
        data: {
          kind,
          id: +id,
          executionTime: +executionTime,
        },
      };
    }
    case EventKind.VoteEmitted: {
      const { voter, id, support, votingPower } =
        rawData.args as GetArgType<'VoteEmitted'>;
      return {
        blockNumber,
        excludeAddresses: [voter],
        network: SupportedNetwork.Aave,
        data: {
          kind,
          id: +id,
          voter,
          support,
          votingPower: votingPower.toString(),
        },
      };
    }
    case EventKind.DelegateChanged: {
      const { delegator, delegatee, delegationType } =
        rawData.args as GetTokenArgType<'DelegateChanged'>;
      return {
        blockNumber,
        excludeAddresses: [delegator],
        network: SupportedNetwork.Aave,
        data: {
          kind,
          tokenAddress: rawData.address,
          delegator,
          delegatee,
          type: delegationType,
        },
      };
    }
    case EventKind.DelegatedPowerChanged: {
      const { user, amount, delegationType } =
        rawData.args as GetTokenArgType<'DelegatedPowerChanged'>;
      return {
        blockNumber,
        excludeAddresses: [user],
        network: SupportedNetwork.Aave,
        data: {
          kind,
          tokenAddress: rawData.address,
          who: user,
          amount: amount.toString(),
          type: delegationType,
        },
      };
    }
    case EventKind.Transfer: {
      const { from, to, value } = rawData.args as GetTokenArgType<'Transfer'>;
      return {
        blockNumber,
        excludeAddresses: [from],
        network: SupportedNetwork.Aave,
        data: {
          kind,
          tokenAddress: rawData.address,
          from,
          to,
          amount: value.toString(),
        },
      };
    }
    case EventKind.Approval: {
      const { owner, spender, value } =
        rawData.args as GetTokenArgType<'Approval'>;
      return {
        blockNumber,
        excludeAddresses: [owner],
        network: SupportedNetwork.Aave,
        data: {
          kind,
          tokenAddress: rawData.address,
          owner,
          spender,
          amount: value.toString(),
        },
      };
    }
    default: {
      throw new Error(`Unknown event kind: ${kind}`);
    }
  }

  return { blockNumber: null, network: SupportedNetwork.Aave, data: null };
}
