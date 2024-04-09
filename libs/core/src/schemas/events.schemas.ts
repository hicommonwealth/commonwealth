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

// All events carry this common metadata
export const EventMetadata = z.object({
  createdAt: z.date(),
  // TODO: TBD
  // aggregateType: z.enum(Aggregates)
  // aggregateId: z.string()
  // correlation: z.string()
  // causation: z.object({})
});

// event NewContest (
//     address contest,
//     address namespace,
//     uint256 interval,
//     bool oneOff
//   ); // from Namespace factory

// event NewContestStarted(
//         uint256 indexed contestId,
//         uint256 startTime,
//         uint256 endTime
//     ); // from contest manager address

// event ContentAdded(
//         uint256 indexed contentId,
//         address indexed creator,
//         string url
//     ); // from contest manager address

// on-chain contest manager events
export const ContestManagerDeployed = EventMetadata.extend({
  namespace: z.string().describe('Community namespace'),
  contestAddress: z.string().describe('Contest manager on-chain address'),
}).describe('When a contest contract manager gets deployed');

export const ContestStarted = EventMetadata.extend({
  namespace: z.string().describe('Community namespace'),
  contestAddress: z.string().describe('Contest manager on-chain address'),
  contestId: z.number().describe('New on-chain contest id'),
}).describe('When a contest instance gets started');

export const ContestContentAdded = EventMetadata.extend({
  contestId: z.number().describe('On-chain contest id'),
  contentId: z.number().describe('New on-chain content id'),
}).describe('When new content is added to a running contest');

export const ContestContentUpvoted = EventMetadata.extend({
  contestId: z.number().describe('On-chain contest id'),
  contentId: z.number().describe('New on-chain content id'),
  address: z.string().describe('Address upvoting on content'),
  weight: z.number().describe('Stake weight of address upvoting on content'),
}).describe('When users upvote content on running contest');

export const ContestWinnersRecorded = EventMetadata.extend({
  contestId: z.number().describe('On-chain contest id'),
  winners: z.array(z.string()).describe('Ranked contest winning addresses'),
}).describe('When contest winners are recorded and contest ends');
