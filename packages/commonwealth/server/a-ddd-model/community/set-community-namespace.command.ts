import { z } from 'zod';
import db from '../../database';
import type { CommunityAttributes } from '../../models/community';
import { InvalidInput } from '../errors';
import type { Command } from '../types';

export const SetCommunityNamespace = z.object({
  namespace: z.string(),
});

/**
 * Sets community namespace
 */
export const setCommunityNamespace: Command<
  typeof SetCommunityNamespace,
  CommunityAttributes
> = async (actor, id, payload) => {
  // if loaded by actor middleware
  // const community = actor.community;

  const community = await db.Community.findOne({ where: { id } });
  if (!community) throw new InvalidInput('Community not found');

  // TODO: validate contract
  // call protocol api

  // payload is validated by message validation middleware
  // TODO: set to namespace instead of name
  community.name = payload.namespace;

  await community.save();

  return community;
};
