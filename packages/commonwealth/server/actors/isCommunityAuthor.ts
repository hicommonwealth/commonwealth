import db from '../database';
import { ActorMiddleware } from './middleware';

export const ALL_COMMUNITIES = 'all_communities';

export const loadCommunity: ActorMiddleware = async (actor, ids) => {
  const community_id = ids?.chain ?? ids?.chain_id ?? ids?.community_id;
  if (!community_id) return 'Must provide community id';

  // if all chains, then bypass validation
  if (community_id === ALL_COMMUNITIES) return actor;

  const community = await db.Community.findOne({ where: { id: community_id } });
  if (!community) return 'Community not found';
  return { ...actor, community };
};

/**
 * Validates actor in context is the author of community in context
 * @param actor the actor
 * @param ids the command ids
 * @returns updated actor
 */
export const isCommunityAuthor: ActorMiddleware = async (actor, ids) => {
  if (!ids?.address) return 'Must provide an address';
  if (!actor.user) return 'Not signed in';
  if (!actor.community) return 'Must provide author community';

  const author = await db.Address.findOne({
    where: {
      user_id: !actor.user.isAdmin && actor.user.id,
      address: ids.address,
      community_id: actor.community.id,
    },
  });
  if (!author) return 'Could not find author';
  if (!author.verified) return 'Author is not verified';
  if (author.user_id !== actor.user.id) return 'Author is not owned by user';

  return {
    ...actor,
    author: true,
  };
};
