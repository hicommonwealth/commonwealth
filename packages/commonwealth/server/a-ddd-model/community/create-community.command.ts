import { z } from 'zod';
import db from '../../database';
import type { CommunityAttributes } from '../../models/community';
import type { Command } from '../types';

export const CreateCommunitySchema = z.object({
  content: z.string(),
});

export type CreateCommunity = z.infer<typeof CreateCommunitySchema>;

export const createCommunity: Command<
  CreateCommunity,
  CommunityAttributes
> = async () =>
  //actor,
  //id,
  //payload,
  {
    // TODO
    const community = await db.Community.findOne();
    return community;
  };
