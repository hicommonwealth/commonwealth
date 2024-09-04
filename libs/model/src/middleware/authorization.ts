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
import { Address, Group, GroupPermissionAction } from '@hicommonwealth/schemas';
import { Role } from '@hicommonwealth/shared';
import { Op, QueryTypes } from 'sequelize';
import { ZodObject, ZodSchema, ZodString, z } from 'zod';
import { models } from '..';

export type CommunityAuth<Input extends ZodSchema = ZodSchema> = CommandHandler<
  Input,
  ZodSchema
>;
export type ThreadAuth<Input extends ZodSchema = ZodSchema> = CommandHandler<
  Input,
  typeof schemas.Thread
>;
export type CommentAuth<Input extends ZodSchema = ZodSchema> = CommandHandler<
  Input,
  typeof schemas.Comment
>;

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
    public action: GroupPermissionAction,
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
  { actor, payload }: CommandContext<ZodSchema>,
  roles: Role[],
): Promise<z.infer<typeof Address>> => {
  if (!actor.address) throw new InvalidActor(actor, 'Must provide an address');

  /*
   * Address authorization conventions:
   * 1. Find by community_id when payload contains community_id or id
   * 2. Find by thread_id when payload contains thread_id
   */
  payload.community_id =
    ('community_id' in payload && payload.community_id) || payload.id;
  if (!payload.community_id) {
    const thread_id = 'thread_id' in payload && payload.thread_id;
    if (!thread_id)
      throw new InvalidInput('Must provide community or thread id');
    const thread = await models.Thread.findOne({ where: { id: thread_id } });
    if (!thread) throw new InvalidInput('Must provide a valid thread id');
    payload.community_id = thread.community_id;
    payload.topic_id = thread.topic_id;
  }

  // TODO: cache
  const addr = (
    await models.Address.findOne({
      where: {
        user_id: actor.user.id,
        address: actor.address,
        community_id: payload.community_id,
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
  action: GroupPermissionAction,
): Promise<void> {
  // By convention, topic_id must by part of the body
  const topic_id = 'topic_id' in payload && payload.topic_id;
  if (!topic_id) throw new InvalidInput('Must provide a topic id');

  const topic = await models.Topic.findOne({ where: { id: topic_id } });
  if (!topic) throw new InvalidInput('Topic not found');
  if (topic.group_ids?.length === 0) return;

  const groups = await models.sequelize.query<
    z.infer<typeof Group> & {
      allowed_actions?: GroupPermissionAction[];
    }
  >(
    `
    SELECT g.*, gp.allowed_actions
    FROM "Groups" as g 
    LEFT JOIN "GroupPermissions" gp ON g.id = gp.group_id
    WHERE g.community_id = :community_id AND g.id IN (:group_ids);
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: {
        community_id: topic.community_id,
        group_ids: topic.group_ids,
      },
    },
  );

  // There are 2 cases here. We either have the old group permission system where the group doesn't have
  // any allowed_actions, or we have the new fine-grained permission system where the action must be in
  // the allowed_actions list.
  const allowed = groups.filter(
    (g) => !g.allowed_actions || g.allowed_actions.includes(action),
  );
  if (!allowed.length!) throw new NonMember(actor, topic.name, action);

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
  if (!memberships.length) throw new NonMember(actor, topic.name, action);

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
  action: GroupPermissionAction,
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
