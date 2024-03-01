import { z } from 'zod';
import { paginationSchema } from './utils.schemas';

export const orderByQueries = {
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
    orderBy: z.nativeEnum(Object.keys(orderByQueries)).optional(),
    ...paginationSchema,
  }),
  output: z.object({
    communityId: z.string().describe('The community id'),
    fromDate: z.date().describe('Filters out threads before this date'),
    toDate: z.date().describe('Filters out threads before this date'),
    archived: z.boolean().default(false),
    includePinnedThreads: z.boolean().default(false),
    topicId: z.string().optional(),
    stage: z.string().optional(),
    orderBy: z.nativeEnum(Object.keys(orderByQueries)).optional(),
    ...paginationSchema,
  }),
};
