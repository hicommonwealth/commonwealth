import {
  InvalidActor,
  InvalidInput,
  type CommandContext,
  type CommandHandler,
} from '@hicommonwealth/core';
import { entities } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { ZodSchema } from 'zod';
import { AddressAttributes, Role, models } from '..';

/**
 * TODO: review rules
 * We have to consider these scenarios
 * - super admin: When the user is a super admin (god mode), allow all operations - no need to specify any flags
 * - community admin or moderator: Allow when user is admin of the community - only applies to community aggregates
 * - aggregate owner: Allow when the user is the owner of the aggregate (entity)
 */

/**
 * Finds one active community address that meets the arguments
 * @param actor command actor
 * @param id community id
 * @param roles roles filter
 * @returns authorized address or throws
 */
const authorizeAddress = async (
  { actor, id }: CommandContext<any>,
  roles: Role[],
): Promise<AddressAttributes> => {
  if (!id) throw new InvalidActor(actor, 'Must provide a community id');
  if (!actor.address_id)
    throw new InvalidActor(actor, 'Must provide an address');
  // TODO: cache
  const addr = (
    await models.Address.findOne({
      where: {
        user_id: actor.user.id,
        address: actor.address_id,
        community_id: id,
        role: { [Op.in]: roles },
      },
      order: [['role', 'DESC']],
    })
  )?.get({ plain: true });
  if (!addr)
    throw new InvalidActor(actor, `User is not ${roles} in the community`);
  return addr;
};

type CommunityMiddleware = CommandHandler<ZodSchema, typeof entities.Community>;
type ThreadMiddleware = CommandHandler<ZodSchema, typeof entities.Thread>;
type CommentMiddleware = CommandHandler<ZodSchema, typeof entities.Comment>;

/**
 * Community middleware
 */
export const isCommunityAdmin: CommunityMiddleware = async (ctx) => {
  // super admin is always allowed
  if (ctx.actor.user.isAdmin) return;
  await authorizeAddress(ctx, ['admin']);
};

export const isCommunityModerator: CommunityMiddleware = async (ctx) => {
  // super admin is always allowed
  if (ctx.actor.user.isAdmin) return;
  await authorizeAddress(ctx, ['moderator']);
};

export const isCommunityAdminOrModerator: CommunityMiddleware = async (ctx) => {
  // super admin is always allowed
  if (ctx.actor.user.isAdmin) return;
  await authorizeAddress(ctx, ['admin', 'moderator']);
};

/**
 * Thread middleware
 */
export const loadThread: ThreadMiddleware = async ({ id }) => {
  if (!id) throw new InvalidInput('Must provide a thread id');
  const thread = (
    await models.Thread.findOne({
      where: { id },
      include: {
        model: models.Address,
        required: true,
        attributes: ['address'],
      },
    })
  )?.get({ plain: true });
  if (!thread) throw new InvalidInput(`Thread ${id} not found`);
  return thread;
};

export const isThreadAuthor: ThreadMiddleware = async ({ actor }, state) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return;
  if (!actor.address_id)
    throw new InvalidActor(actor, 'Must provide an address');
  if (!state) throw new InvalidActor(actor, 'Must load thread');
  if (state.Address?.address !== actor.address_id)
    throw new InvalidActor(actor, 'User is not the author of the thread');
};

/**
 * Comment middleware
 */
export const loadComment: CommentMiddleware = async ({ id }) => {
  if (!id) throw new InvalidInput('Must provide a comment id');
  const comment = (
    await models.Comment.findOne({
      where: { id },
      include: {
        model: models.Address,
        required: true,
        attributes: ['address'],
      },
    })
  )?.get({ plain: true });
  if (!comment) throw new InvalidInput(`Comment ${id} not found`);
  return comment;
};

export const isCommentAuthor: CommentMiddleware = async ({ actor }, state) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return;
  if (!actor.address_id)
    throw new InvalidActor(actor, 'Must provide an address');
  if (!state) throw new InvalidActor(actor, 'Must load comment');
  if (state.Address?.address !== actor.address_id)
    throw new InvalidActor(actor, 'User is not the author of the comment');
};
