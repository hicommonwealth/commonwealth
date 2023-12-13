import db from '../database';
import { ActorMiddleware } from './middleware';

/**
 * Validates actor in context is the author of community in context
 * @param actor the actor
 * @returns updated actor with author = true
 */
export const isCommunityAuthor: ActorMiddleware = async (actor) => {
  if (!actor.user) return 'Not signed in';
  if (!actor.address) return 'Must provide address';
  if (!actor.community) return 'Must provide community';

  const author = await db.Address.findOne({
    where: {
      user_id: !actor.user.isAdmin && actor.user.id,
      address: actor.address,
      community_id: actor.community.id,
    },
  });
  if (!author) return 'Could not find author';
  if (!author.verified) return 'Author is not verified';
  if (author.user_id !== actor.user.id) return 'Author is not owned by user';

  return { ...actor, author: true };
};
