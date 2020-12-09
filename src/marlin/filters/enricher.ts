import { hexToNumberString, hexToNumber as web3HexToNumber } from 'web3-utils';
import { CWEvent } from '../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';


export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent,
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    // MPond events
    case EventKind.Approval: {
      const {
        owner,
        spender,
        amount
      } = rawData.args as any;

      return {
        blockNumber,
        excludeAddresses: [ owner, ],
        data: {
          kind,
          owner,
          spender,
          amount,
        },
      };
    }
    case EventKind.DelegateChanged: {
      const {
        delegator,
        fromDelegate,
        toDelegate,
      } = rawData.args as any;

      return {
        blockNumber,
        excludeAddresses: [ delegator ],
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
      } = rawData.args as any;

      return {
        blockNumber,
        excludeAddresses: [ delegate ],
        data: {
          kind,
          delegate,
          previousBalance,
          newBalance,
        },
      };
    }
    case EventKind.Transfer: {
      const {
        from,
        to,
        amount
      } = rawData.args as any;

      return {
        blockNumber,
        excludeAddresses: [ from ],
        data: {
          kind,
          from,
          to,
          amount,
        },
      };
    }
    // GovernorAlpha Events
    case EventKind.ProposalCanceled: {
      const { id, } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id,
        },
      };
    }
    case EventKind.ProposalCreated: {
      const {
        id,
        proposer,
        targets,
        values,
        signatures,
        calldatas,
        startBlock,
        endBlock,
        description,
      } = rawData.args as any;

      return {
        blockNumber,
        excludeAddresses: [ proposer ],
        data: {
          kind,
          id,
          proposer,
          targets,
          values,
          signatures,
          calldatas,
          startBlock,
          endBlock,
          description,
        },
      };
    }
    case EventKind.ProposalExecuted: {
      const { id, } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id,
        }
      }
    }
    case EventKind.ProposalQueued: {
      const { id, eta } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id,
          eta,
        }
      }
    }
    case EventKind.VoteCast: {
      const {
        voter,
        proposalId,
        support,
        votes,
      } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [ voter, ],
        data: {
          kind,
          voter,
          id: proposalId,
          support,
          votes,
        },
      };
    }
    // Timelock events
    case EventKind.CancelTransaction: {
      const { txHash, target, value, signature, data, eta } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          txHash,
          target,
          value,
          signature,
          data,
          eta,
        },
      };
    }
    case EventKind.ExecuteTransaction: {
      const { txHash, target, value, signature, data, eta } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          txHash,
          target,
          value,
          signature,
          data,
          eta,
        },
      };
    }
    case EventKind.NewAdmin: {
      const { newAdmin, } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [ newAdmin, ],
        data: {
          kind,
          newAdmin,
        },
      };
    }
    case EventKind.NewDelay: {
      const { newDelay, } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          newDelay,
        },
      };
    }
    case EventKind.NewPendingAdmin: {
      const { newPendingAdmin, } = rawData.args as any;
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
      const { txHash, target, value, signature, data, eta, } = rawData.args as any; 
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          txHash,
          target,
          value,
          signature,
          data,
          eta,
        },
      };
    }

    default: {
      throw new Error('unknown marlin event kind!');
    }
  }

  return { blockNumber: null, data: null, }
}