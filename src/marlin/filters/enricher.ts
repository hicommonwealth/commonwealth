/* eslint-disable @typescript-eslint/no-explicit-any */
import { BigNumber, Contract } from 'ethers';

import { Timelock, MPond, GovernorAlpha } from '../../contractTypes';
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
    // MPond events
    case EventKind.Approval: {
      const { owner, spender, amount } = rawData.args as GetArgType<
        MPond,
        'Approval'
      >;

      return {
        blockNumber,
        excludeAddresses: [owner],
        data: {
          kind,
          owner,
          spender,
          amount: amount.toString(),
        },
      };
    }
    case EventKind.DelegateChanged: {
      const {
        delegator,
        fromDelegate,
        toDelegate,
      } = rawData.args as GetArgType<MPond, 'DelegateChanged'>;

      return {
        blockNumber,
        excludeAddresses: [delegator],
        data: {
          kind,
          delegator,
          fromDelegate,
          toDelegate,
        },
      };
    }
    case EventKind.DelegateVotesChanged: {
      const {
        delegate,
        previousBalance,
        newBalance,
      } = rawData.args as GetArgType<MPond, 'DelegateVotesChanged'>;

      return {
        blockNumber,
        excludeAddresses: [delegate],
        data: {
          kind,
          delegate,
          previousBalance: previousBalance.toString(),
          newBalance: newBalance.toString(),
        },
      };
    }
    case EventKind.Transfer: {
      const { from, to, amount } = rawData.args as GetArgType<
        MPond,
        'Transfer'
      >;

      return {
        blockNumber,
        excludeAddresses: [from],
        data: {
          kind,
          from,
          to,
          amount: amount.toString(),
        },
      };
    }
    // GovernorAlpha Events
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
        targets,
        signatures,
        calldatas,
        startBlock,
        endBlock,
        description,
      } = rawData.args as GetArgType<GovernorAlpha, 'ProposalCreated'>;

      // values doesn't appear on the object version, hack around it by accessing the
      // argument array instead
      const values = rawData.args[3] as BigNumber[];

      return {
        blockNumber,
        excludeAddresses: [proposer],
        data: {
          kind,
          id: +id,
          proposer,
          targets,
          values: values.map((v) => v.toString()),
          signatures,
          calldatas,
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
    // Timelock events
    case EventKind.CancelTransaction: {
      const {
        txHash,
        target,
        value,
        signature,
        data,
        eta,
      } = rawData.args as GetArgType<Timelock, 'CancelTransaction'>;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          txHash,
          target,
          value: value.toString(),
          signature,
          data,
          eta: +eta,
        },
      };
    }
    case EventKind.ExecuteTransaction: {
      const {
        txHash,
        target,
        value,
        signature,
        data,
        eta,
      } = rawData.args as GetArgType<Timelock, 'ExecuteTransaction'>;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          txHash,
          target,
          value: value.toString(),
          signature,
          data,
          eta: +eta,
        },
      };
    }
    case EventKind.NewAdmin: {
      const { newAdmin } = rawData.args as GetArgType<Timelock, 'NewAdmin'>;
      return {
        blockNumber,
        excludeAddresses: [newAdmin],
        data: {
          kind,
          newAdmin,
        },
      };
    }
    case EventKind.NewDelay: {
      const { newDelay } = rawData.args as GetArgType<Timelock, 'NewDelay'>;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          newDelay: +newDelay,
        },
      };
    }
    case EventKind.NewPendingAdmin: {
      const { newPendingAdmin } = rawData.args as GetArgType<
        Timelock,
        'NewPendingAdmin'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          newPendingAdmin,
        },
      };
    }
    case EventKind.QueueTransaction: {
      const {
        txHash,
        target,
        value,
        signature,
        data,
        eta,
      } = rawData.args as GetArgType<Timelock, 'QueueTransaction'>;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          txHash,
          target,
          value: value.toString(),
          signature,
          data,
          eta: +eta,
        },
      };
    }

    default: {
      throw new Error('unknown marlin event kind!');
    }
  }

  return { blockNumber: null, data: null };
}
