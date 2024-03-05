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
  title: z.string().optional(),
};
