/* eslint-disable @typescript-eslint/no-explicit-any */
import { Contract } from 'ethers';

import { GovernorAlpha } from '../../contractTypes';
import { TypedEventFilter } from '../../contractTypes/commons';
import { CWEvent } from '../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';

type GetEventArgs<T> = T extends TypedEventFilter<any, infer Y> ? Y : never;
type GetArgType<
  C extends Contract,
  Name extends keyof C['filters']
> = GetEventArgs<ReturnType<C['filters'][Name]>>;

export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.ProposalCanceled: {
      const { id } = rawData.args as GetArgType<
        GovernorAlpha,
        'ProposalCanceled'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id: +id,
        },
      };
    }
    case EventKind.ProposalCreated: {
      const {
        id,
        proposer,
        startBlock,
        endBlock,
        description,
      } = rawData.args as GetArgType<GovernorAlpha, 'ProposalCreated'>;

      return {
        blockNumber,
        excludeAddresses: [proposer],
        data: {
          kind,
          id: +id,
          proposer,
          startBlock: +startBlock,
          endBlock: +endBlock,
          description,
        },
      };
    }
    case EventKind.ProposalExecuted: {
      const { id } = rawData.args as GetArgType<
        GovernorAlpha,
        'ProposalExecuted'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id: +id,
        },
      };
    }
    case EventKind.ProposalQueued: {
      const { id, eta } = rawData.args as GetArgType<
        GovernorAlpha,
        'ProposalQueued'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id: +id,
          eta: +eta,
        },
      };
    }
    case EventKind.VoteCast: {
      const { voter, proposalId, support, votes } = rawData.args as GetArgType<
        GovernorAlpha,
        'VoteCast'
      >;
      return {
        blockNumber,
        excludeAddresses: [voter],
        data: {
          kind,
          voter,
          id: +proposalId,
          support,
          votes: votes.toString(),
        },
      };
    }
    default: {
      throw new Error('unknown compound event kind!');
    }
  }

  return { blockNumber: null, data: null };
}
