import { AppError } from '@hicommonwealth/core';
import type {
  DB,
  ProfileTagsAttributes,
  TagsAttributes,
} from '@hicommonwealth/model';
import { GetNewProfileReq, GetNewProfileResp } from '@hicommonwealth/schemas';
import type { NextFunction } from 'express';
import { Op } from 'sequelize';
import z from 'zod';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  NoIdentifierProvided: 'No profile id provided in query',
  NoProfileFound: 'No profile found',
};

type ProfileWithTags = ProfileTagsAttributes & { Tag: TagsAttributes };

const getNewProfile = async (
  models: DB,
  req: TypedRequestQuery<z.infer<typeof GetNewProfileReq>>,
  res: TypedResponse<z.infer<typeof GetNewProfileResp>>,
  next: NextFunction,
) => {
  const { profileId } = req.query;
  let user_id = req.user?.id;

  // TO BE REMOVED
  if (profileId) {
    const parsedInt = parseInt(profileId);
    if (isNaN(parsedInt) || parsedInt !== parseFloat(profileId)) {
      throw new AppError('Invalid profile id');
    }
    const address = await models.Address.findOne({
      where: {
        profile_id: profileId,
      },
      attributes: ['user_id'],
    });
    user_id = address?.user_id;
  }

  const user = await models.User.findOne({ where: { id: user_id } });
  if (!user) return next(new Error(Errors.NoProfileFound));

  // TODO: We can actually query all user activity in a single statement
  // Activity is defined as user addresses (ids) with votes, threads, comments in active communities

  const addresses = await models.Address.findAll({
    where: { user_id },
    include: [
      {
        model: models.Community,
        required: true,
        where: { active: true },
        attributes: ['id'],
      },
    ],
  });

  const addressIds = [...new Set<number>(addresses.map((a) => a.id!))];
  const communityIds = [
    ...new Set<string>(addresses.map((a) => a.community_id!)),
  ];

  const totalUpvotes = await models.Reaction.count({
    where: {
      address_id: { [Op.in]: addressIds },
    },
  });

  const threads = await models.Thread.findAll({
    where: {
      address_id: { [Op.in]: addressIds },
      community_id: { [Op.in]: communityIds },
    },
    include: [{ model: models.Address, as: 'Address' }],
  });

  const comments = await models.Comment.findAll({
    where: {
      address_id: { [Op.in]: addressIds },
      community_id: { [Op.in]: communityIds },
    },
    include: [{ model: models.Address, as: 'Address' }],
  });

  const commentThreadIds = [
    ...new Set<number>(comments.map((c) => c.thread_id, 10)),
  ];
  const commentThreads = await models.Thread.findAll({
    where: {
      id: { [Op.in]: commentThreadIds },
      community_id: { [Op.in]: communityIds },
    },
  });

  const profileTags = await models.ProfileTags.findAll({
    where: { user_id },
    include: [{ model: models.Tags }],
  });

  return success(res, {
    profile: user.profile,
    totalUpvotes,
    addresses: addresses.map((a) => a.toJSON()),
    threads: threads.map((t) => t.toJSON()),
    comments: comments.map((c) => c.toJSON()),
    commentThreads: commentThreads.map((c) => c.toJSON()),
    isOwner: req.user?.id === user_id,
    tags: profileTags
      .map((t) => t.toJSON())
      .map((t) => (t as ProfileWithTags).Tag),
  });
};

export default getNewProfile;
