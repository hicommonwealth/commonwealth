import z from 'zod';
import { Address } from './address.schemas';
import {
  discordMetaSchema,
  linksSchema,
  paginationSchema,
} from './utils.schemas';

export const Thread = z.object({
  Address: Address.optional(),
  address_id: z.number(),
  title: z.string(),
  kind: z.string(),
  stage: z.string(),
  id: z.number().optional(),
  body: z.string().optional(),
  plaintext: z.string().optional(),
  url: z.string().optional(),
  topic_id: z.number().optional(),
  pinned: z.boolean().optional(),
  community_id: z.string(),
  view_count: z.number(),
  links: z.object(linksSchema).array().optional(),

  read_only: z.boolean().optional(),
  version_history: z.array(z.string()).optional(),

  has_poll: z.boolean().optional(),

  canvas_action: z.string(),
  canvas_session: z.string(),
  canvas_hash: z.string(),

  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  last_edited: z.date().optional(),
  deleted_at: z.date().optional(),
  last_commented_on: z.date().optional(),
  marked_as_spam_at: z.date().optional(),
  archived_at: z.date().optional(),
  locked_at: z.date().optional(),
  discord_meta: z.object(discordMetaSchema).optional(),

  //counts
  reaction_count: z.number(),
  reaction_weights_sum: z.number(),
  comment_count: z.number(),

  //notifications
  max_notif_id: z.number(),
});

export const OrderByQueriesKeys = z.enum([
  'createdAt:asc',
  'createdAt:desc',
  'numberOfComments:asc',
  'numberOfComments:desc',
  'numberOfLikes:asc',
  'numberOfLikes:desc',
  'latestActivity:asc',
  'latestActivity:desc',
]);

export const GetBulkThreads = {
  input: z.object({
    community_id: z.string().describe('The community id'),
    fromDate: z
      .date()
      .describe('Filters out threads before this date')
      .optional(),
    toDate: z
      .date()
      .describe('Filters out threads before this date')
      .optional(),
    // archived: z.coerce.boolean().default(false),
    // includePinnedThreads: z.coerce.boolean().default(false),
    topicId: z.string().optional(),
    stage: z.string().optional(),
    orderBy: OrderByQueriesKeys.default('createdAt:desc'),
    ...paginationSchema,
  }),
  output: z.object({
    limit: z.number(),
    page: z.number(),
    numVotingThreads: z.number(),
    threads: z
      .object({
        id: z.number(),
        title: z.string(),
        url: z.string(),
        body: z.string(),
        last_edited: z.date().optional(),
        kind: z.string(),
        stage: z.string(),
        read_only: z.boolean(),
        discord_meta: z.object(discordMetaSchema).optional(),
        pinned: z.boolean(),
        chain: z.string(),
        created_at: z.date(),
        updated_at: z.date(),
        locked_at: z.date().optional(),
        links: z.object(linksSchema).array().optional(),
        collaborators: z.string().array(),
        has_poll: z.boolean().optional(),
        last_commented_on: z.date().optional(),
        plaintext: z.string(),
        Address: z.object({
          id: z.number(),
          address: z.string(),
          community_id: z.string(),
        }),
        numberOfComments: z.number(),
        reactionIds: z.number().array(),
        reactionTimestamps: z.date().array(),
        reactionWeights: z.number().array(),
        reaction_weights_sum: z.number(),
        addressesReacted: z.string().array(),
        reactionType: z.string().array(),
        marked_as_spam_at: z.string().optional(),
        archived_at: z.date().optional(),
        latest_activity: z.date().optional(),
        topic: z.object({
          id: z.number(),
          name: z.string(),
          description: z.string(),
          chainId: z.string(),
        }),
      })
      .array(),
  }),
};
