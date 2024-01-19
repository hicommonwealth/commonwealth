import { models } from '../database'; // TODO: use port/adapter pattern to test in-memory
import { ActorMiddleware } from '../types';

// TODO: Important - Let's analyze all existing validation routines and their usage patterns
// - Auth loading/caching operations can be optimized
// - Instead of loading the community and the admin address in two db request, we can load everything at once if this is a common pattern

/**
 * Middleware to validate user as author of the loaded community
 * @param actor the actor state
 * @returns updated actor state with validated author flag, or error string
 */
export const isCommunityAuthor: ActorMiddleware = async (actor) => {
  if (!actor?.address_id) return 'Must provide an address';
  if (!actor.community) return 'Must load community';

  // TODO: wrap in cache
  const author = await models.Address.findOne({
    where: {
      user_id: !actor.user.isAdmin && actor.user.id, // TODO: validate this logic
      address: actor.address_id,
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
