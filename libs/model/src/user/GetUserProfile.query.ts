import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../database';

export function GetUserProfile(): Query<typeof schemas.GetUserProfile> {
  return {
    ...schemas.GetUserProfile,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      const user_id = payload.userId ?? actor.user.id;

      const user = await models.User.findOne({
        where: { id: user_id },
        attributes: ['profile'],
      });

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
          return { ...address, Community: address.Community! }; // ensure Community is present in typed response
        }),
        threads: threads.map((t) => t.toJSON()),
        comments: comments.map((c) => {
          const comment = c.toJSON();
          return {
            ...comment,
            Thread: undefined,
            community_id: c.Thread!.community_id,
          }; // ensure typed response
        }),
        commentThreads: commentThreads.map((c) => c.toJSON()),
        isOwner: actor.user.id === user_id,
        tags: profileTags.map((t) => ({ id: t.Tag!.id!, name: t.Tag!.name })), // ensure Tag is present in typed response
      };
    },
  };
}
