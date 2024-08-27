import {
  InvalidActor,
  InvalidInput,
  type CommandContext,
  type CommandHandler,
  type CommandInput,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Role } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { AddressAttributes, models } from '..';

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
 * @param payload command payload including aggregate id
 * @param roles roles filter
 * @returns authorized address or throws
 */
const authorizeAddress = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { actor, payload }: CommandContext<any>,
  roles: Role[],
): Promise<AddressAttributes> => {
  if (!payload.id) throw new InvalidActor(actor, 'Must provide a community id');
  if (!actor.address_id)
    throw new InvalidActor(actor, 'Must provide an address');
  // TODO: cache
  const addr = (
    await models.Address.findOne({
      where: {
        user_id: actor.user.id,
        address: actor.address_id,
        community_id: payload.id,
        role: { [Op.in]: roles },
      },
      order: [['role', 'DESC']],
    })
  )?.get({ plain: true });
  if (!addr)
    throw new InvalidActor(actor, `User is not ${roles} in the community`);
  return addr;
};

type CommunityMiddleware = CommandHandler<
  CommandInput,
  typeof schemas.Community
>;
type ThreadMiddleware = CommandHandler<CommandInput, typeof schemas.Thread>;
type CommentMiddleware = CommandHandler<CommandInput, typeof schemas.Comment>;

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
export const loadThread: ThreadMiddleware = async ({ payload }) => {
  if (!payload.id) throw new InvalidInput('Must provide a thread id');
  const thread = (
    await models.Thread.findOne({
      where: { id: payload.id },
      include: {
        model: models.Address,
        required: true,
        attributes: ['address'],
      },
    })
  )?.get({ plain: true });
  if (!thread) throw new InvalidInput(`Thread ${payload.id} not found`);
  return thread;
};

export const isThreadAuthor: ThreadMiddleware = ({ actor }, state) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return Promise.resolve();
  if (!actor.address_id)
    throw new InvalidActor(actor, 'Must provide an address');
  if (!state) throw new InvalidActor(actor, 'Must load thread');
  if (state.Address?.address !== actor.address_id)
    throw new InvalidActor(actor, 'User is not the author of the thread');
  return Promise.resolve();
};

/**
 * Comment middleware
 */
export const loadComment: CommentMiddleware = async ({ payload }) => {
  if (!payload.id) throw new InvalidInput('Must provide a comment id');
  const comment = (
    await models.Comment.findOne({
      where: { id: payload.id },
      include: {
        model: models.Address,
        required: true,
        attributes: ['address'],
      },
    })
  )?.get({ plain: true });
  if (!comment) throw new InvalidInput(`Comment ${payload.id} not found`);
  return comment;
};

export const isCommentAuthor: CommentMiddleware = ({ actor }, state) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return Promise.resolve();
  if (!actor.address_id)
    throw new InvalidActor(actor, 'Must provide an address');
  if (!state) throw new InvalidActor(actor, 'Must load comment');
  if (state.Address?.address !== actor.address_id)
    throw new InvalidActor(actor, 'User is not the author of the comment');

  return Promise.resolve();
};
