import {
  Actor,
  INVALID_ACTOR_ERROR,
  InvalidActor,
  InvalidInput,
  QueryHandler,
  type CommandContext,
  type CommandHandler,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Address, ForumActions } from '@hicommonwealth/schemas';
import { Role } from '@hicommonwealth/shared';
import { Op, QueryTypes } from 'sequelize';
import { ZodObject, ZodSchema, ZodString, z } from 'zod';
import { GroupInstance, models } from '..';

export type CommunityAuth = CommandHandler<ZodSchema, ZodSchema>;
export type ThreadAuth = CommandHandler<ZodSchema, typeof schemas.Thread>;
export type CommentAuth = CommandHandler<ZodSchema, typeof schemas.Comment>;

export class BannedActor extends InvalidActor {
  constructor(public actor: Actor) {
    super(actor, 'Banned User');
    this.name = INVALID_ACTOR_ERROR;
  }
}

export class NonMember extends InvalidActor {
  constructor(
    public actor: Actor,
    public topic: string,
    public action: ForumActions,
  ) {
    super(
      actor,
      `User does not have permission to perform action ${action} in topic ${topic}`,
    );
    this.name = INVALID_ACTOR_ERROR;
  }
}

export class RejectedMember extends InvalidActor {
  constructor(
    public actor: Actor,
    public reasons: string[],
  ) {
    super(actor, reasons.join(', '));
    this.name = INVALID_ACTOR_ERROR;
  }
}

/**
 * TODO: review rules
 * We have to consider these scenarios
 * - super admin: When the user is a super admin (god mode), allow all operations - no need to specify any flags
 * - community admin or moderator: Allow when user is admin of the community - only applies to community aggregates
 * - aggregate owner: Allow when the user is the owner of the aggregate (entity)
 */

/**
 * Binds actor to active community address that meets the arguments
 * @param actor command actor
 * @param payload command payload including aggregate id
 * @param roles roles filter
 */
const authorizeAddress = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // `CommandContext<CommandInput>` prevents use of this function in Query middleware
  // due to `id` being required in the core command framework.
  // This issue can be resolved with https://github.com/hicommonwealth/commonwealth/issues/9009
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { actor, payload }: CommandContext<any>,
  roles: Role[],
): Promise<z.infer<typeof Address>> => {
  // By convention, secure requests must provide community_id/id + address arguments
  const community_id =
    ('community_id' in payload && payload.community_id) || payload.id;
  if (!community_id)
    throw new InvalidActor(actor, 'Must provide a community id');
  if (!actor.address) throw new InvalidActor(actor, 'Must provide an address');

  // TODO: cache
  const addr = (
    await models.Address.findOne({
      where: {
        user_id: actor.user.id,
        address: actor.address,
        community_id,
        role: { [Op.in]: roles },
      },
      order: [['role', 'DESC']],
    })
  )?.get({ plain: true });
  if (!addr)
    throw new InvalidActor(actor, `User is not ${roles} in the community`);

  (actor as { addressId: number }).addressId = addr.id!;
  return addr;
};

/**
 * Checks if actor passes a set of requirements and grants access for all groups of the given topic
 */
async function isTopicMember(
  { actor, payload }: CommandContext<ZodSchema>,
  action: ForumActions,
): Promise<void> {
  // By convention, topic_id must by part of the body
  const topic_id = 'topic_id' in payload && payload.topic_id;
  if (!topic_id) throw new InvalidInput('Must provide a topic id');

  const groups: (GroupInstance & {
    allowed_actions?: ForumActions[];
  })[] = await models.sequelize.query(
    `
        SELECT g.*, gp.allowed_actions FROM "Groups" as g LEFT JOIN "GroupPermissions" gp ON g.id = gp.group_id
        WHERE gp.topic_id = :topicId;
      `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: { topicId: topic_id },
    },
  );

  // if there are no permissions for this topic, then anyone can perform any action on it (default behaviour).
  if (groups.length === 0) {
    return;
  }

  const allowed = groups.filter(
    (g) => !g.allowed_actions || g.allowed_actions.includes(action),
  );

  // if no group allows the specified action for the given topic, then reject because regardless of membership the user
  // will not be allowed.
  if (allowed?.length === 0) {
    throw new NonMember(actor, groups[0]!.metadata!.name, action);
  }

  // check membership for all groups of topic
  const memberships = await models.Membership.findAll({
    where: {
      group_id: { [Op.in]: allowed.map((g) => g.id!) },
      address_id: actor.addressId,
    },
    include: [
      {
        model: models.Group,
        as: 'group',
      },
    ],
  });

  if (!memberships.length)
    throw new NonMember(actor, groups[0]!.metadata!.name, action);

  const rejects = memberships.filter((m) => m.reject_reason);
  if (rejects.length === memberships.length)
    throw new RejectedMember(
      actor,
      rejects.flatMap((reject) =>
        reject.reject_reason!.map((reason) => reason.message),
      ),
    );
}

type CommunityQueryMiddleware = QueryHandler<
  ZodObject<{
    community_id: ZodString;
  }>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>;

export const isCommunityAdminQuery: CommunityQueryMiddleware = async (ctx) => {
  if (ctx.actor.user.isAdmin) return;
  await authorizeAddress(ctx, ['admin']);
};

/**
 * Community middleware
 */
export const isCommunityAdmin: CommunityAuth = async (ctx) => {
  // super admin is always allowed
  if (ctx.actor.user.isAdmin) return;
  await authorizeAddress(ctx, ['admin']);
};

export const isCommunityModerator: CommunityAuth = async (ctx) => {
  // super admin is always allowed
  if (ctx.actor.user.isAdmin) return;
  await authorizeAddress(ctx, ['moderator']);
};

export const isCommunityAdminOrModerator: CommunityAuth = async (ctx) => {
  // super admin is always allowed
  if (ctx.actor.user.isAdmin) return;
  await authorizeAddress(ctx, ['admin', 'moderator']);
};

export function isCommunityAdminOrTopicMember(
  action: ForumActions,
): CommunityAuth {
  return async (ctx) => {
    // super admin is always allowed
    if (ctx.actor.user.isAdmin) return;
    const addr = await authorizeAddress(ctx, ['admin', 'moderator', 'member']);
    if (addr.role === 'member') {
      if (addr.is_banned) throw new BannedActor(ctx.actor);
      await isTopicMember(ctx, action);
    }
  };
}

/**
 * Thread middleware
 */
export const loadThread: ThreadAuth = async ({ payload }) => {
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

export const isThreadAuthor: ThreadAuth = ({ actor }, state) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return Promise.resolve();
  if (!actor.address) throw new InvalidActor(actor, 'Must provide an address');
  if (!state) throw new InvalidActor(actor, 'Must load thread');
  if (state.Address?.address !== actor.address)
    throw new InvalidActor(actor, 'User is not the author of the thread');
  return Promise.resolve();
};

/**
 * Comment middleware
 */
export const loadComment: CommentAuth = async ({ payload }) => {
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

export const isCommentAuthor: CommentAuth = ({ actor }, state) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return Promise.resolve();
  if (!actor.address) throw new InvalidActor(actor, 'Must provide an address');
  if (!state) throw new InvalidActor(actor, 'Must load comment');
  if (state.Address?.address !== actor.address)
    throw new InvalidActor(actor, 'User is not the author of the comment');

  return Promise.resolve();
};
