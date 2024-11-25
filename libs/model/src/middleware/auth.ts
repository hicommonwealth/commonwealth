import {
  Actor,
  Context,
  InvalidActor,
  InvalidInput,
  InvalidState,
} from '@hicommonwealth/core';
import {
  Address,
  AuthContext,
  AuthContextInput,
  CommentContext,
  CommentContextInput,
  Group,
  GroupPermissionAction,
  PollContext,
  PollContextInput,
  ReactionContext,
  ReactionContextInput,
  ThreadContext,
  ThreadContextInput,
  TopicContext,
  TopicContextInput,
} from '@hicommonwealth/schemas';
import { Role } from '@hicommonwealth/shared';
import { Op, QueryTypes } from 'sequelize';
import { ZodSchema, z } from 'zod';
import { models } from '../database';
import { AddressInstance } from '../models';
import { BannedActor, NonMember, RejectedMember } from './errors';

async function findComment(actor: Actor, comment_id: number) {
  const comment = await models.Comment.findOne({
    where: { id: comment_id },
    include: [
      {
        model: models.Thread,
        required: true,
      },
    ],
  });
  if (!comment)
    throw new InvalidInput('Must provide a valid comment id to authorize');

  return {
    comment_id,
    comment,
    author_address_id: comment.address_id,
    community_id: comment.Thread!.community_id!,
    topic_id: comment.Thread!.topic_id ?? undefined,
    thread_id: comment.Thread!.id!,
  };
}

async function findThread(
  actor: Actor,
  thread_id: number,
  collaborators: boolean,
) {
  const include = collaborators
    ? {
        model: models.Address,
        as: 'collaborators',
        required: false,
      }
    : undefined;
  const thread = await models.Thread.findOne({
    where: { id: thread_id },
    include,
  });
  if (!thread)
    throw new InvalidInput('Must provide a valid thread id to authorize');

  let is_collaborator = false;
  if (collaborators) {
    const found = thread?.collaborators?.find(
      ({ address }) => address === actor.address,
    );
    is_collaborator = !!found;
  }

  return {
    thread_id,
    thread,
    author_address_id: thread.address_id,
    community_id: thread.community_id,
    topic_id: thread.topic_id,
    is_collaborator,
  };
}

async function findTopic(actor: Actor, topic_id: number) {
  const topic = await models.Topic.findOne({ where: { id: topic_id } });
  if (!topic)
    throw new InvalidInput('Must provide a valid topic id to authorize');

  return {
    topic_id,
    topic,
    community_id: topic.community_id,
  };
}

async function findReaction(
  actor: Actor,
  community_id: string,
  reaction_id: number,
) {
  const reaction = await models.Reaction.findOne({
    where: { id: reaction_id },
  });
  if (!reaction)
    throw new InvalidInput('Must provide a valid reaction id to authorize');

  return {
    reaction_id,
    reaction,
    community_id,
    author_address_id: reaction.address_id,
  };
}

async function findPoll(actor: Actor, poll_id: number) {
  const poll = await models.Poll.findOne({
    where: { id: poll_id },
  });
  if (!poll) {
    throw new InvalidInput('Must provide a valid poll id to authorize');
  }

  return poll;
}

async function findAddress(
  actor: Actor,
  community_id: string,
  roles: Role[],
  author_address_id?: number,
): Promise<{ address: AddressInstance; is_author: boolean }> {
  if (!actor.address)
    throw new InvalidActor(actor, 'Must provide an address to authorize');

  if (!community_id)
    throw new InvalidInput('Must provide a valid community id to authorize');

  // Policies as system actors behave like super admins
  // TODO: we can check if there is an address to load or fake it
  if (actor.is_system_actor) {
    return {
      address: {} as AddressInstance,
      is_author: false,
    };
  }

  // Loads and tracks real user's address activity
  const address = await models.Address.findOne({
    where: {
      user_id: actor.user.id,
      address: actor.address,
      community_id,
      role: { [Op.in]: roles },
      verified: { [Op.ne]: null },
      // TODO: check verification token expiration
    },
    order: [['role', 'DESC']],
  });

  if (address) {
    // fire and forget address activity tracking
    address.last_active = new Date();
    void address.save();
    return {
      address,
      is_author: address.id === author_address_id,
    };
  }

  // simulate non-member super admins
  if (!actor.user.isAdmin)
    throw new InvalidActor(actor, `User is not ${roles} in the community`);

  const super_address = await models.Address.findOne({
    where: {
      user_id: actor.user.id,
      address: actor.address,
    },
  });
  if (!super_address)
    throw new InvalidActor(actor, `Super admin address not found`);

  return {
    address: super_address,
    is_author: false,
  };
}

/**
 * Checks if actor address passes a set of requirements and grants access for all groups of the given topic
 */
async function hasTopicPermissions(
  actor: Actor,
  address_id: number,
  action: GroupPermissionAction,
  topic_id: number,
): Promise<void> {
  if (!topic_id)
    throw new InvalidInput('Must provide a valid topic id to authorize');

  const topic = await models.Topic.findOne({ where: { id: topic_id } });
  if (!topic) throw new InvalidInput('Topic not found');

  if (topic.group_ids?.length === 0) return;

  // check if user has permission to perform "action" in 'topic_id'
  // the 'topic_id' can belong to any group where user has membership
  // the group with 'topic_id' having higher permissions will take precedence
  const groups = await models.sequelize.query<
    z.infer<typeof Group> & {
      allowed_actions?: GroupPermissionAction[];
    }
  >(
    `
        SELECT g.*, gp.topic_id, gp.allowed_actions
        FROM "Groups" as g
                 JOIN "GroupPermissions" gp ON g.id = gp.group_id
        WHERE g.community_id = :community_id
          AND gp.topic_id = :topic_id
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: {
        community_id: topic.community_id,
        topic_id: topic.id,
      },
    },
  );

  // There are 2 cases here. We either have the old group permission system where the group doesn't have
  // any group_allowed_actions, or we have the new fine-grained permission system where the action must be in
  // the group_allowed_actions list.
  const allowedActions = groups.filter(
    (g) => !g.allowed_actions || g.allowed_actions.includes(action),
  );
  if (allowedActions.length === 0)
    throw new NonMember(actor, topic.name, action);

  // check membership for all groups of topic
  const memberships = await models.Membership.findAll({
    where: {
      group_id: { [Op.in]: allowedActions.map((g) => g.id!) },
      address_id,
    },
    include: [
      {
        model: models.Group,
        as: 'group',
      },
    ],
  });
  if (memberships.length === 0) throw new NonMember(actor, topic.name, action);

  const rejects = memberships.filter((m) => m.reject_reason);
  if (rejects.length === memberships.length)
    throw new RejectedMember(
      actor,
      rejects.flatMap((reject) =>
        reject.reject_reason!.map((reason) => reason.message),
      ),
    );
}

/**
 * Generic authorization guard used by all middleware once the authorization context is loaded
 */
async function mustBeAuthorized(
  { actor, context }: Context<ZodSchema, ZodSchema>,
  check: {
    permissions?: {
      topic_id: number;
      action: GroupPermissionAction;
    };
    author?: boolean;
    collaborators?: z.infer<typeof Address>[];
  },
) {
  // System actors are always allowed
  if (actor.is_system_actor) return;

  // Admins (and super admins) are always allowed to act on any entity
  if (actor.user.isAdmin || context.address.role === 'admin') return;

  // Banned actors are always rejected (if not admin or system actors)
  if (context.address.is_banned) throw new BannedActor(actor);

  // Author is always allowed to act on their own entity, unless banned
  if (context.is_author) return;

  // Allows when actor has group permissions in topic
  if (check.permissions)
    return await hasTopicPermissions(
      actor,
      context.address!.id!,
      check.permissions.action,
      check.permissions.topic_id,
    );

  // Allows when actor is a collaborator in the thread
  if (check.collaborators) {
    const found = check.collaborators?.find(
      ({ address }) => address === actor.address,
    );
    context.is_collaborator = !!found;
    if (context.is_collaborator) return;
    throw new InvalidActor(actor, 'Not authorized collaborator');
  }

  // At this point, we know the actor is not the author of the entity
  // and it's also not an admin, system actor, or collaborator...
  // This guard is used to enforce that the author is the only one who can
  // perform actions on the entity.
  if (check.author)
    throw new InvalidActor(actor, 'Not the author of the entity');
}

/**
 * Utility to easily create a system actor.
 * We can identify each policy actor by a predefined system user id,
 * email, and address.
 * This will allow us to audit and track distinct policy actors.
 *
 * @param address a distict policy address, defaults to "0x0"
 * @param id a distict policy user id, defaults to 0
 * @param email a distict policy email address, defaults to `system@common.im`
 * @returns system actor flagged as a system actor
 */
export const systemActor = ({
  address = '0x0',
  id = 0,
  email = 'system@common.im',
}: {
  address?: string;
  id?: number;
  email?: string;
}): Actor => ({
  user: { id, email },
  address,
  is_system_actor: true,
});

export async function isSuperAdmin(ctx: Context<ZodSchema, ZodSchema>) {
  if (!ctx.actor.user.isAdmin)
    await Promise.reject(new InvalidActor(ctx.actor, 'Must be a super admin'));
}

/**
 * Validates if actor's address is authorized
 * @param roles specific community roles - all by default
 * @throws InvalidActor when not authorized
 */
export function authRoles(...roles: Role[]) {
  return async (ctx: Context<typeof AuthContextInput, typeof AuthContext>) => {
    const { address, is_author } = await findAddress(
      ctx.actor,
      ctx.payload.community_id,
      ctx.actor.user.isAdmin || !roles.length
        ? ['admin', 'moderator', 'member']
        : roles,
    );

    (ctx as { context: AuthContext }).context = {
      address,
      is_author,
      community_id: ctx.payload.community_id,
    };

    await mustBeAuthorized(ctx, {});
  };
}

type AggregateAuthOptions = {
  roles?: Role[];
  action?: GroupPermissionAction;
  author?: boolean;
  collaborators?: boolean;
};

/**
 * Validates if actor's address is authorized to perform actions on a comment
 * @param action specific group permission action
 * @param author when true, rejects members that are not the author
 * @throws InvalidActor when not authorized
 */
export function authComment({ action, author }: AggregateAuthOptions) {
  return async (
    ctx: Context<typeof CommentContextInput, typeof CommentContext>,
  ) => {
    const auth = await findComment(ctx.actor, ctx.payload.comment_id);
    const { address, is_author } = await findAddress(
      ctx.actor,
      auth.community_id,
      ['admin', 'moderator', 'member'],
      auth.author_address_id,
    );

    (ctx as { context: CommentContext }).context = {
      ...auth,
      address,
      is_author,
    };

    await mustBeAuthorized(ctx, {
      permissions: action ? { action, topic_id: auth.topic_id! } : undefined,
      author,
    });
  };
}

/**
 * Validates if actor's address is authorized to perform actions on a thread
 * @param action specific group permission action
 * @param author when true, rejects members that are not the author
 * @param collaborators authorize thread collaborators
 * @throws InvalidActor when not authorized
 */
export function authThread({
  action,
  author,
  collaborators,
}: AggregateAuthOptions) {
  return async (
    ctx: Context<typeof ThreadContextInput, typeof ThreadContext>,
  ) => {
    const auth = await findThread(
      ctx.actor,
      ctx.payload.thread_id,
      collaborators ?? false,
    );
    const { address, is_author } = await findAddress(
      ctx.actor,
      auth.community_id,
      ['admin', 'moderator', 'member'],
      auth.author_address_id,
    );

    (ctx as { context: ThreadContext }).context = {
      ...auth,
      address,
      is_author,
    };

    await mustBeAuthorized(ctx, {
      permissions: action ? { action, topic_id: auth.topic_id! } : undefined,
      author,
      collaborators: collaborators ? auth.thread.collaborators! : undefined,
    });
  };
}

/**
 * Validates if actor's address is authorized to perform actions on a topic
 * @param action specific group permission action
 * @throws InvalidActor when not authorized
 */
export function authTopic({ roles, action }: AggregateAuthOptions) {
  return async (
    ctx: Context<typeof TopicContextInput, typeof TopicContext>,
  ) => {
    const auth = await findTopic(ctx.actor, ctx.payload.topic_id);
    const { address, is_author } = await findAddress(
      ctx.actor,
      auth.community_id,
      roles ?? ['admin', 'moderator', 'member'],
    );

    (ctx as { context: TopicContext }).context = {
      ...auth,
      address,
      is_author,
    };

    await mustBeAuthorized(ctx, {
      permissions: action ? { action, topic_id: auth.topic_id } : undefined,
    });
  };
}

/**
 * Validates if actor's address is authorized to perform actions on a reaction
 * @throws InvalidActor when not authorized
 */
export function authReaction() {
  return async (
    ctx: Context<typeof ReactionContextInput, typeof ReactionContext>,
  ) => {
    const auth = await findReaction(
      ctx.actor,
      ctx.payload.community_id,
      ctx.payload.reaction_id,
    );
    const { address, is_author } = await findAddress(
      ctx.actor,
      auth.community_id,
      ['admin', 'moderator', 'member'],
      auth.author_address_id,
    );

    (ctx as { context: ReactionContext }).context = {
      ...auth,
      address,
      is_author,
    };

    // reactions are only authorized by the author
    await mustBeAuthorized(ctx, { author: true });
  };
}

export function authPoll({ action }: AggregateAuthOptions) {
  return async (ctx: Context<typeof PollContextInput, typeof PollContext>) => {
    const poll = await findPoll(ctx.actor, ctx.payload.poll_id);
    const threadAuth = await findThread(ctx.actor, poll.thread_id, false);
    const { address, is_author } = await findAddress(
      ctx.actor,
      threadAuth.community_id,
      ['admin', 'moderator', 'member'],
    );

    if (threadAuth.thread.archived_at)
      throw new InvalidState('Thread is archived');
    (ctx as { context: PollContext }).context = {
      address,
      is_author,
      poll,
      poll_id: poll.id!,
      community_id: threadAuth.community_id,
      thread: threadAuth.thread,
    };

    await mustBeAuthorized(ctx, {
      author: true,
      permissions: action
        ? {
            topic_id: threadAuth.topic_id,
            action,
          }
        : undefined,
    });
  };
}
