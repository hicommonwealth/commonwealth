import { z } from 'zod';

export const ThreadCreated = z.object({ thread: z.string() });
export const CommentCreated = z.object({ comment: z.string() });
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

// All events should carry this common metadata
export const EventMetadata = z.object({
  createdAt: z.date().describe('When the event was emitted'),
  // TODO: TBD
  // aggregateType: z.enum(Aggregates).describe("Event emitter aggregate type")
  // aggregateId: z.string().describe("Event emitter aggregate id")
  // correlation: z.string().describe("Event correlation key")
  // causation: z.object({}).describe("Event causation")
});

// on-chain contest manager events
export const ContestManagerDeployed = EventMetadata.extend({
  namespace: z.string().describe('Community namespace'),
  contest: z.string().describe('Contest manager address'),
  interval: z.number().int().positive().describe('Recurring constest interval'),
  oneOff: z.boolean().describe('Flags one-off contests'),
}).describe('When a contest contract manager gets deployed');

export const ContestStarted = EventMetadata.extend({
  contest: z.string().describe('Contest manager address'),
  contestId: z.number().int().describe('New contest instance id'),
  startTime: z.date().describe('Contest start time'),
  endTime: z.date().describe('Contest end time'),
}).describe('When a contest instance gets started');

export const ContestContentAdded = EventMetadata.extend({
  contest: z.string().describe('Contest manager address'),
  contestId: z.number().describe('Contest instance id'),
  contentId: z.number().describe('New content id'),
  creator: z.string().describe('Address of content creator'),
  url: z.string().describe('Content url'),
}).describe('When new content is added to a running contest');

export const ContestContentUpvoted = EventMetadata.extend({
  contest: z.string().describe('Contest manager address'),
  contestId: z.number().describe('Contest instance id'),
  contentId: z.number().describe('New content id'),
  address: z.string().describe('Address upvoting on content'),
  weight: z.number().describe('Stake weight of address upvoting on content'),
}).describe('When users upvote content on running contest');

export const ContestWinnersRecorded = EventMetadata.extend({
  contest: z.string().describe('Contest manager address'),
  contestId: z.number().describe('Contest instance id'),
  winners: z
    .array(z.string())
    .describe('Ranked contest-winning creator addresses'),
}).describe('When contest winners are recorded and contest ends');
