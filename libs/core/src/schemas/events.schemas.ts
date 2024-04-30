import { z } from 'zod';
import { Comment, Thread } from './entities.schemas';
import { ETHERS_BIG_NUMBER, EVM_ADDRESS } from './utils.schemas';

export const ThreadCreated = Thread;
export const CommentCreated = Comment;
export const GroupCreated = z.object({
  groupId: z.string(),
  userId: z.string(),
});
export const CommunityCreated = z.object({
  communityId: z.string(),
  userId: z.string(),
});
export const SnapshotProposalCreated = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  choices: z.array(z.string()).optional(),
  space: z.string().optional(),
  event: z.string().optional(),
  start: z.string().optional(),
  expire: z.string().optional(),
  token: z.string().optional(),
  secret: z.string().optional(),
});
export const DiscordMessageCreated = z.object({
  user: z
    .object({
      id: z.string(),
      username: z.string(),
    })
    .optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  message_id: z.string(),
  channel_id: z.string().optional(),
  parent_channel_id: z.string().optional(),
  guild_id: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  action: z.union([
    z.literal('thread-delete'),
    z.literal('thread-title-update'),
    z.literal('thread-body-update'),
    z.literal('thread-create'),
    z.literal('comment-delete'),
    z.literal('comment-update'),
    z.literal('comment-create'),
  ]),
});

export const CommunityStakeTrade = z.tuple([
  EVM_ADDRESS.describe('trader'),
  EVM_ADDRESS.describe('namespaceAddress'),
  z.boolean().describe('isBuy'),
  ETHERS_BIG_NUMBER.describe('communityTokenAmount'),
  ETHERS_BIG_NUMBER.describe('ethAmount'),
  ETHERS_BIG_NUMBER.describe('protocolEthAmount'),
  ETHERS_BIG_NUMBER.describe('nameSpaceEthAmount'),
  ETHERS_BIG_NUMBER.describe('supply'),
  EVM_ADDRESS.describe('exchangeToken'),
]);

export const NamespaceDeployed = z.tuple([
  z.string().describe('name'),
  EVM_ADDRESS.describe('_feeManger'),
  z.string().describe('_signature'),
  EVM_ADDRESS.describe('_namespaceDeployer'),
]);

export const AaveV2ProposalCreated = z.tuple([
  ETHERS_BIG_NUMBER.describe('id'),
  EVM_ADDRESS.describe('creator'),
  EVM_ADDRESS.describe('executor'),
  z.array(EVM_ADDRESS).describe('targets'),
  z.array(z.string()).describe('signatures'),
  z.array(z.string()).describe('calldatas'),
  z.array(z.boolean()).describe('withDelegatecalls'),
  ETHERS_BIG_NUMBER.describe('startBlock'),
  ETHERS_BIG_NUMBER.describe('endBlock'),
  EVM_ADDRESS.describe('strategy'),
  z.string().describe('ipfsHash'),
]);

export const AaveV2ProposalQueued = z.tuple([
  ETHERS_BIG_NUMBER.describe('id'),
  ETHERS_BIG_NUMBER.describe('executionTime'),
  EVM_ADDRESS.describe('initiatorQueueing'),
]);

export const AaveV2ProposalExecuted = z.tuple([
  ETHERS_BIG_NUMBER.describe('id'),
  EVM_ADDRESS.describe('initiatorExecution'),
]);

export const GovBravoProposalCreated = z.tuple([
  ETHERS_BIG_NUMBER.describe('proposalId'),
  EVM_ADDRESS.describe('proposer'),
  z.array(EVM_ADDRESS).describe('targets'),
  z.array(ETHERS_BIG_NUMBER).describe('values'),
  z.array(z.string()).describe('signatures'),
  z.array(z.string()).describe('calldatas'),
  ETHERS_BIG_NUMBER.describe('startBlock'),
  ETHERS_BIG_NUMBER.describe('endBlock'),
  z.string().describe('description'),
]);

export const GovBravoProposalQueued = z.tuple([
  ETHERS_BIG_NUMBER.describe('proposalId'),
  ETHERS_BIG_NUMBER.describe('eta'),
]);

export const GovBravoProposalExecuted = z.tuple([
  ETHERS_BIG_NUMBER.describe('proposalId'),
]);

export const GenericProposalCanceled = z.tuple([
  ETHERS_BIG_NUMBER.describe('proposalId'),
]);

const ChainEventCreatedBase = z.object({
  eventSource: z.object({
    kind: z.string(),
    chainNodeId: z.number(),
  }),
  rawLog: z.object({
    blockNumber: z.number(),
    blockHash: z.string(),
    transactionIndex: z.number(),
    removed: z.boolean(),
    address: z.string(),
    data: z.string(),
    topics: z.array(z.string()),
    transactionHash: z.string(),
    logIndex: z.number(),
  }),
});

/**
 * Zod schema for EvmEvent type defined in workers/evmChainEvents/types.ts
 */
export const ChainEventCreated = z.union([
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
      ),
    }),
    parsedArgs: GovBravoProposalCreated,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0xd272d67d2c8c66de43c1d2515abb064978a5020c173e15903b6a2ab3bf7440ec',
      ),
    }),
    parsedArgs: AaveV2ProposalCreated,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x11a0b38e70585e4b09b794bd1d9f9b1a51a802eb8ee2101eeee178d0349e73fe',
      ),
    }),
    parsedArgs: AaveV2ProposalQueued,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892',
      ),
    }),
    parsedArgs: GovBravoProposalQueued,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
      ),
    }),
    parsedArgs: GovBravoProposalExecuted,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x9c85b616f29fca57a17eafe71cf9ff82ffef41766e2cf01ea7f8f7878dd3ec24',
      ),
    }),
    parsedArgs: AaveV2ProposalExecuted,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
      ),
    }),
    parsedArgs: GenericProposalCanceled,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5',
      ),
    }),
    parsedArgs: NamespaceDeployed,
  }),
  ChainEventCreatedBase.extend({
    eventSource: ChainEventCreatedBase.shape.eventSource.extend({
      eventSignature: z.literal(
        '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e',
      ),
    }),
    parsedArgs: CommunityStakeTrade,
  }),
]);

// All events should carry this common metadata
export const EventMetadata = z.object({
  created_at: z.date().describe('When the event was emitted'),
  // TODO: TBD
  // aggregateType: z.enum(Aggregates).describe("Event emitter aggregate type")
  // aggregateId: z.string().describe("Event emitter aggregate id")
  // correlation: z.string().describe("Event correlation key")
  // causation: z.object({}).describe("Event causation")
});

// on-chain contest manager events
export const RecurringContestManagerDeployed = EventMetadata.extend({
  namespace: z.string().describe('Community namespace'),
  contest_address: z.string().describe('Contest manager address'),
  interval: z.number().int().positive().describe('Recurring constest interval'),
}).describe('When a new recurring contest manager gets deployed');

export const OneOffContestManagerDeployed = EventMetadata.extend({
  namespace: z.string().describe('Community namespace'),
  contest_address: z.string().describe('Contest manager address'),
  length: z.number().int().positive().describe('Length of contest in days'),
}).describe('When a new one-off contest manager gets deployed');

const ContestManagerEvent = EventMetadata.extend({
  contest_address: z.string().describe('Contest manager address'),
  contest_id: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Recurring contest id'),
});

export const ContestStarted = ContestManagerEvent.extend({
  start_time: z.date().describe('Contest start time'),
  end_time: z.date().describe('Contest end time'),
}).describe('When a contest instance gets started');

export const ContestContentAdded = ContestManagerEvent.extend({
  content_id: z.number().int().positive().describe('New content id'),
  creator_address: z.string().describe('Address of content creator'),
  content_url: z.string(),
}).describe('When new content is added to a running contest');

export const ContestContentUpvoted = ContestManagerEvent.extend({
  content_id: z.number().int().positive().describe('Content id'),
  voter_address: z.string().describe('Address upvoting on content'),
  voting_power: z
    .number()
    .int()
    .describe('Voting power of address upvoting on content'),
}).describe('When users upvote content on running contest');

export const ContestWinnersRecorded = ContestManagerEvent.extend({
  winners: z
    .array(
      z.object({
        creator_address: z.string(),
        prize: z.number().int().positive(),
      }),
    )
    .describe('Contest winners from first to last'),
}).describe('When contest winners are recorded and contest ends');
