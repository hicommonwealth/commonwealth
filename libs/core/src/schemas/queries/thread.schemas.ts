import { z } from 'zod';
import {
  discordMetaSchema,
  linksSchema,
  paginationSchema,
} from '../utils.schemas';

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
    community_id: z.string(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    archived: z.boolean().default(false),
    includePinnedThreads: z.boolean().default(false),
    topicId: z.string().optional(),
    stage: z.string().nullable().optional(),
    orderBy: OrderByQueriesKeys.default('createdAt:desc').nullable(),
    cursor: z.number().nullish(),
    ...paginationSchema,
  }),
  output: z.object({
    limit: z.number(),
    numVotingThreads: z.number(),
    cursor: z.number(),
    threads: z
      .object({
        id: z.number(),
        title: z.string(),
        url: z.string().nullable(),
        body: z.string(),
        last_edited: z.date().nullable().optional(),
        kind: z.string(),
        stage: z.string(),
        read_only: z.boolean(),
        discord_meta: z.object(discordMetaSchema).nullable().optional(),
        pinned: z.boolean(),
        chain: z.string(),
        created_at: z.date(),
        updated_at: z.date(),
        locked_at: z.date().nullable().optional(),
        links: z.object(linksSchema).array().nullable().optional(),
        collaborators: z.any().array(),
        has_poll: z.boolean().nullable().optional(),
        last_commented_on: z.date().nullable().optional(),
        plaintext: z.string(),
        Address: z.object({
          id: z.number(),
          address: z.string(),
          community_id: z.string(),
        }),
        numberOfComments: z.number(),
        reactionIds: z.string().array(),
        reactionTimestamps: z.coerce.date().array(),
        reactionWeights: z.number().array(),
        reaction_weights_sum: z.number(),
        addressesReacted: z.string().array(),
        reactionType: z.string().array(),
        marked_as_spam_at: z.date().nullable().optional(),
        archived_at: z.date().nullable().optional(),
        latest_activity: z.date().nullable().optional(),
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
