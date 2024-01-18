import { z } from 'zod';
import { models } from '../database';
import { InvalidInput } from '../errors';
import type { CommunityAttributes } from '../models';
import type { Command } from '../types';

export const SetCommunityNamespaceSchema = z.object({
  namespace: z.string(),
});

export type SetCommunityNamespace = z.infer<typeof SetCommunityNamespaceSchema>;

/**
 * Sets community namespace
 */
export const setCommunityNamespace: Command<
  typeof SetCommunityNamespaceSchema,
  CommunityAttributes
> = async (actor, id, payload) => {
  // if loaded by actor middleware
  // const community = actor.community;

  const community = await models.Community.findOne({ where: { id } });
  if (!community) throw new InvalidInput('Community not found');

  // TODO: validate contract
  // call protocol api

  // payload is validated by message validation middleware
  // TODO: set to namespace instead of name
  community.name = payload.namespace;

  await community.save();

  return community;
};
