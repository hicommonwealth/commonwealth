import { InvalidInput, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

export function GetUserProfile(): Query<typeof schemas.GetUserProfile> {
  return {
    ...schemas.GetUserProfile,
    auth: [],
    secure: false,
    body: async ({ actor, payload }) => {
      const user_id = payload.userId ?? actor.user?.id;
      if (!user_id) throw new InvalidInput('Missing user id');

      const user = await models.User.findOne({
        where: { id: user_id },
        attributes: ['profile', 'xp_points'],
      });

      mustExist('User', user);

      const addresses = await models.Address.findAll({
        where: { user_id },
        include: [
          {
            model: models.Community,
            required: true,
            where: { active: true },
            attributes: ['id', 'base', 'ss58_prefix'],
          },
        ],
      });

      const addressIds = [...new Set(addresses.map((a) => a.id!))];
      const communityIds = [...new Set(addresses.map((a) => a.community_id!))];

      const totalUpvotes = await models.Reaction.count({
        where: { address_id: { [Op.in]: addressIds } },
      });

      const threads = await models.Thread.findAll({
        where: {
          address_id: { [Op.in]: addressIds },
          community_id: { [Op.in]: communityIds },
        },
        include: [{ model: models.Address, as: 'Address' }],
      });

      const comments = await models.Comment.findAll({
        where: { address_id: { [Op.in]: addressIds } },
        include: [
          { model: models.Address, as: 'Address' },
          {
            model: models.Thread,
            required: true,
            attributes: ['community_id'],
            where: { community_id: { [Op.in]: communityIds } },
          },
        ],
      });

      const commentThreadIds = [
        ...new Set(comments.map((c) => c.thread_id, 10)),
      ];
      const commentThreads = await models.Thread.findAll({
        where: { id: { [Op.in]: commentThreadIds } },
      });

      const profileTags = await models.ProfileTags.findAll({
        where: { user_id },
        include: [{ model: models.Tags }],
      });

      return {
        userId: user_id!,
        profile: user!.profile,
        totalUpvotes,
        addresses: addresses.map((a) => {
          const address = a.toJSON();
          // ensure Community is present in typed response
          return { ...address, Community: address.Community! } as z.infer<
            typeof schemas.UserProfileAddressView
          >;
        }),
        threads: threads.map(
          (t) => t.toJSON() as z.infer<typeof schemas.ThreadView>,
        ),
        comments: comments.map((c) => {
          const comment = {
            ...c.toJSON(),
            user_id: c.Address!.user_id!,
            address: c.Address!.address!,
            last_active: c.Address!.last_active!,
            Thread: undefined,
            search: undefined,
            community_id: c.Thread!.community_id,
          };
          return comment as z.infer<typeof schemas.CommentView>;
        }),
        commentThreads: commentThreads.map(
          (c) => c.toJSON() as z.infer<typeof schemas.ThreadView>,
        ),
        isOwner: actor.user?.id === user_id,
        // ensure Tag is present in typed response
        tags: profileTags.map((t) => ({ id: t.Tag!.id!, name: t.Tag!.name })),
        xp_points: user!.xp_points ?? 0,
      };
    },
  };
}
