import {
  Actor,
  INVALID_ACTOR_ERROR,
  InvalidActor,
  InvalidInput,
  type Context,
  type Handler,
} from '@hicommonwealth/core';
import {
  Group,
  GroupPermissionAction,
} from '@hicommonwealth/schemas';
import { Role } from '@hicommonwealth/shared';
import { Op, QueryTypes } from 'sequelize';
import { ZodSchema, z } from 'zod';
import { models } from '../database';
import type {
  AddressInstance,
  CommentInstance,
  ThreadInstance,
  TopicInstance,
} from '../models';

export type AuthContext = {
  address: AddressInstance | null;
  community_id?: string | null;
  topic_id?: number | null;
  thread_id?: number | null;
  comment_id?: number | null;
  topic?: TopicInstance | null;
  thread?: ThreadInstance | null;
  comment?: CommentInstance | null;
  author_address_id?: number;
  is_author: boolean;
  is_collaborator?: boolean;
};

export type AuthHandler<Input extends ZodSchema = ZodSchema> = Handler<
  Input,
  ZodSchema,
  AuthContext
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
 * Builds authorization context
 *
 * TODO: Keep developing this pattern for other entities!
 * The idea is that authorized requests could include aggregate ids that should be pre-loaded
 * and authorized by prefilling the authorization context.
 *
 * Currenlty, the waterfall is:
 * by comment_id
 *   or by thread_id
       or by community_id (community_id or id)
 *
 * TODO: Find ways to cache() by args to avoid db trips
 *
 * @param ctx execution context
 * @param roles community roles filter when authorizing specific roles
 * @param collaborators flag to include thread collaborators when preloading threads
 * @returns authorization context
 */
async function buildAuth(
  ctx: Context<ZodSchema, AuthContext>,
  roles: Role[],
  collaborators = false,
): Promise<AuthContext> {
  const { actor, payload } = ctx;
  if (!actor.address)
    throw new InvalidActor(ctx.actor, 'Must provide an address');

  const { id, community_id, topic_id, thread_id, comment_id } = payload;
  const auth: AuthContext = {
    address: null,
    is_author: false,
    community_id: community_id || id,
    topic_id,
    thread_id,
    comment_id,
  };
  (ctx as { auth: AuthContext }).auth = auth;

  if (auth.comment_id) {
    auth.comment = await models.Comment.findOne({
      where: { id: auth.comment_id },
      include: [
        {
          model: models.Thread,
          required: true,
        },
      ],
    });
    if (!auth.comment)
      throw new InvalidInput('Must provide a valid comment id');
    auth.community_id = auth.comment.Thread!.community_id;
    auth.topic_id = auth.comment.Thread!.topic_id;
    auth.thread_id = auth.comment.Thread!.id;
    auth.author_address_id = auth.comment.address_id;
  } else if (auth.thread_id) {
    const include = collaborators
      ? {
          model: models.Address,
          as: 'collaborators',
          required: false,
        }
      : undefined;
    auth.thread = await models.Thread.findOne({
      where: { id: auth.thread_id },
      include,
    });
    if (!auth.thread) throw new InvalidInput('Must provide a valid thread id');
    auth.community_id = auth.thread.community_id;
    auth.topic_id = auth.thread.topic_id;
    auth.author_address_id = auth.thread.address_id;
  } else if (!auth.community_id)
    throw new InvalidInput('Must provide a community id');

  auth.address = await models.Address.findOne({
    where: {
      user_id: actor.user.id,
      address: actor.address,
      community_id: auth.community_id,
      role: { [Op.in]: roles },
      verified: { [Op.ne]: null },
      // TODO: check verification token expiration
    },
    order: [['role', 'DESC']],
  });

  if (!auth.address) {
    if (!actor.user.isAdmin)
      throw new InvalidActor(actor, `User is not ${roles} in the community`);

    // simulate non-member super admins
    auth.address = await models.Address.findOne({
      where: {
        user_id: actor.user.id,
        address: actor.address,
      },
    });
    if (!auth.address)
      throw new InvalidActor(actor, `Super admin address not found`);
  }

  auth.is_author = auth.address!.id === auth.author_address_id;

  // fire and forget address activity tracking
  auth.address.last_active = new Date();
  void auth.address.save();

  return auth;
}

/**
 * Checks if actor passes a set of requirements and grants access for all groups of the given topic
 */
async function hasTopicInteractionPermissions(
  actor: Actor,
  auth: AuthContext,
  action: GroupPermissionAction,
): Promise<void> {
  if (!auth.topic_id) throw new InvalidInput('Must provide a topic id');

  auth.topic = await models.Topic.findOne({ where: { id: auth.topic_id } });
  if (!auth.topic) throw new InvalidInput('Topic not found');

  if (auth.topic.group_ids?.length === 0) return;

  // check if user has permission to perform "action" in 'topic_id'
  // the 'topic_id' can belong to any group where user has membership
  // the group with 'topic_id' having higher permissions will take precedence
  const groups = await models.sequelize.query<
    z.infer<typeof Group> & {
      allowed_actions?: GroupPermissionAction[];
    }
  >(
    `
    SELECT 
      g.*, 
      gp.allowed_actions as allowed_actions
    FROM "Groups" as g 
    LEFT JOIN "GroupPermissions" gp ON g.id = gp.group_id AND gp.topic_id = :topic_id
    WHERE g.community_id = :community_id
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: {
        community_id: auth.topic.community_id,
        topic_id: auth.topic.id,
      },
    },
  );

  // There are 2 cases here. We either have the old group permission system where the group doesn't have
  // any group_allowed_actions, or we have the new fine-grained permission system where the action must be in
  // the group_allowed_actions list.
  const allowedGroupActions = groups.filter(
    (g) => !g.allowed_actions || g.allowed_actions.includes(action),
  );
  if (!allowedGroupActions.length!)
    throw new NonMember(actor, auth.topic.name, action);

  // check membership for all groups of topic
  const memberships = await models.Membership.findAll({
    where: {
      group_id: { [Op.in]: allowedGroupActions.map((g) => g.id!) },
      address_id: auth.address!.id,
    },
    include: [
      {
        model: models.Group,
        as: 'group',
      },
    ],
  });
  if (!memberships.length) throw new NonMember(actor, auth.topic.name, action);

  const rejects = memberships.filter((m) => m.reject_reason);
  if (rejects.length === memberships.length)
    throw new RejectedMember(
      actor,
      rejects.flatMap((reject) =>
        reject.reject_reason!.map((reason) => reason.message),
      ),
    );
}

//  MIDDLEWARE
export const isSuperAdmin: AuthHandler = async (ctx) => {
  if (!ctx.actor.user.isAdmin)
    await Promise.reject(new InvalidActor(ctx.actor, 'Must be a super admin'));
};

/**
 * Validates if actor's address is authorized by checking in the following order:
 * - 1. **in roles**: User address must be in the provided community roles
 * - 2. **admin**: Allows all operations when the user is an admin or super admin (god mode, site admin)
 * - 3. **not banned**: Reject if address is banned
 * - 4. **topic group**: Allows when address has group permissions in topic
 * - 5. **author**: Allows when address is the creator of the entity
 * - 6. **collaborators**: Allows when address is a collaborator
 *
 * @param roles specific community roles - all by default
 * @param action specific group permission action
 * @param author when true, rejects members that are not the author
 * @param collaborators authorize thread collaborators
 * @throws InvalidActor when not authorized
 */
export function isAuthorized({
  roles = ['admin', 'moderator', 'member'],
  action,
  author = false,
  collaborators = false,
}: {
  roles?: Role[];
  action?: GroupPermissionAction;
  author?: boolean;
  collaborators?: boolean;
}): AuthHandler {
  return async (ctx) => {
    const isAdmin = ctx.actor.user.isAdmin;

    const auth = await buildAuth(
      ctx,
      isAdmin ? ['admin', 'moderator', 'member'] : roles,
      collaborators,
    );

    if (isAdmin || auth.address?.role === 'admin') return;

    if (auth.address!.is_banned) throw new BannedActor(ctx.actor);

    if (action) {
      // waterfall stops here after validating the action
      await hasTopicInteractionPermissions(
        ctx.actor,
        auth,
        action,
      );
      return;
    }

    if (auth.is_author) return;

    if (collaborators) {
      const found = auth.thread?.collaborators?.find(
        ({ address }) => address === ctx.actor.address,
      );
      auth.is_collaborator = !!found;
      if (auth.is_collaborator) return;
      throw new InvalidActor(ctx.actor, 'Not authorized collaborator');
    }

    if (author && auth.address?.role === 'member')
      throw new InvalidActor(ctx.actor, 'Not authorized author');

    // at this point, the address is either a moderator or member
    // without any security requirements for action, author, or collaboration
  };
}
