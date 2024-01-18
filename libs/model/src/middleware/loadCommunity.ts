import { models } from '../database';
import type { ActorMiddleware } from './actor-middleware';

export const ALL_COMMUNITIES = 'all_communities';

/**
 * Middleware to load community attributes
 * @param actor the actor state
 * @returns updated actor state with loaded community, or error string
 */
export const loadCommunity: ActorMiddleware = async (actor) => {
  if (!actor.community_id) return 'Must provide community id';

  // if all chains, then bypass validation
  if (actor.community_id === ALL_COMMUNITIES) return actor;

  // TODO: wrap in cache
  const community = await models.Community.findOne({
    where: { id: actor.community_id },
  });
  if (!community) return 'Community not found';

  return { ...actor, community };
};
