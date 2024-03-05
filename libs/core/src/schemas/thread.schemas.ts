import z from 'zod';
import {
  discordMetaSchema,
  linksSchema,
  paginationSchema,
} from './utils.schemas';

export const Thread = z.object({
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

const OrderByQueriesKeys = z.enum([
  'createdAt:asc',
  'createdAt:desc',
  'numberOfComments:asc',
  'numberOfComments:desc',
  'numberOfLikes:asc',
  'numberOfLikes:desc',
  'latestActivity:asc',
  'latestActivity:desc',
]);

export const orderByQueries: Record<
  z.infer<typeof OrderByQueriesKeys>,
  string
> = {
  'createdAt:asc': 'threads.thread_created ASC',
  'createdAt:desc': 'threads.thread_created DESC',
  'numberOfComments:asc': 'threads_number_of_comments ASC',
  'numberOfComments:desc': 'threads_number_of_comments DESC',
  'numberOfLikes:asc': 'threads_total_likes ASC',
  'numberOfLikes:desc': 'threads_total_likes DESC',
  'latestActivity:asc': 'latest_activity ASC',
  'latestActivity:desc': 'latest_activity DESC',
} as const;

export const GetBulkThreads = {
  input: z.object({
    communityId: z.string().describe('The community id'),
    fromDate: z.date().describe('Filters out threads before this date'),
    toDate: z.date().describe('Filters out threads before this date'),
    archived: z.boolean().default(false),
    includePinnedThreads: z.boolean().default(false),
    topicId: z.string().optional(),
    stage: z.string().optional(),
    orderBy: OrderByQueriesKeys.optional(),
    ...paginationSchema,
  }),
  output: z.object({
    results: Thread.array(),
  }),
};
