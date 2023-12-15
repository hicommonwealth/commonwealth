import { z } from 'zod';
import db from '../../database';
import type { CommunityAttributes } from '../../models/community';
import type { Command } from '../types';

export const CreateCommunity = z.object({
  content: z.string(),
});

export const createCommunity: Command<
  typeof CreateCommunity,
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
