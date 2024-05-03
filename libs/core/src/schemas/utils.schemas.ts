import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '@hicommonwealth/shared';
import { z } from 'zod';

export enum LinkSource {
  Snapshot = 'snapshot',
  Proposal = 'proposal',
  Thread = 'thread',
  Web = 'web',
  Template = 'template',
}

export const paginationSchema = {
  limit: z.coerce
    .number()
    .int()
    .default(20)
    .describe('The number of objects returned'),
  offset: z.coerce
    .number()
    .int()
    .default(0)
    .describe('The amount of objects offset from the beginning'),
  page: z.coerce.number().int().default(1).describe('The page returned'),
};

export const discordMetaSchema = {
  user: z.object({
    id: z.string(),
    username: z.string(),
  }),
  channel_id: z.string(),
  message_id: z.string(),
};

export const linksSchema = {
  source: z.nativeEnum(LinkSource),
  identifier: z.string(),
  title: z.string().nullable().optional(),
};

export enum EventNames {
  ChainEventCreated = 'ChainEventCreated',
  CommentCreated = 'CommentCreated',
  CommunityCreated = 'CommunityCreated',
  DiscordMessageCreated = 'DiscordMessageCreated',
  GroupCreated = 'GroupCreated',
  SnapshotProposalCreated = 'SnapshotProposalCreated',
  ThreadCreated = 'ThreadCreated',
  UserMentioned = 'UserMentioned',

  // Contests
  RecurringContestManagerDeployed = 'RecurringContestManagerDeployed',
  OneOffContestManagerDeployed = 'OneOffContestManagerDeployed',
  ContestStarted = 'ContestStarted',
  ContestContentAdded = 'ContestContentAdded',
  ContestContentUpvoted = 'ContestContentUpvoted',
  ContestWinnersRecorded = 'ContestWinnersRecorded',
}

export const PG_INT = z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT);

export const ETHERS_BIG_NUMBER = z.object({
  hex: z.string().regex(/^0x[0-9a-fA-F]+$/),
  type: z.literal('BigNumber'),
});

export const EVM_ADDRESS = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
