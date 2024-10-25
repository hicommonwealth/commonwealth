import { AppError } from '@hicommonwealth/core';
import type {
  AddressInstance,
  DB,
  TagsAttributes,
} from '@hicommonwealth/model';
import {
  GetNewProfileReq,
  GetNewProfileResp,
  ProfileTags,
  ThreadView,
} from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import type { NextFunction } from 'express';
import { Op } from 'sequelize';
import z from 'zod';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  NoIdentifierProvided: 'No profile id provided in query',
  NoProfileFound: 'No profile found',
};

type ProfileWithTags = z.infer<typeof ProfileTags> & { Tag: TagsAttributes };

export type ExtendedAddessInstance = AddressInstance & {
  Community: {
    id: string;
    base: ChainBase;
    ss58_prefix?: number;
  };
};

const getNewProfile = async (
  models: DB,
  req: TypedRequestQuery<z.infer<typeof GetNewProfileReq>>,
  res: TypedResponse<z.infer<typeof GetNewProfileResp>>,
  next: NextFunction,
) => {
  const user_id = req.query.userId ? +req.query.userId : req.user?.id;
  if (!user_id) return next(new AppError(Errors.NoIdentifierProvided));

  const user = await models.User.findOne({ where: { id: user_id } });
  if (!user) return next(new AppError(Errors.NoProfileFound));

  // TODO: We can actually query all user activity in a single statement
  // Activity is defined as user addresses (ids) with votes, threads, comments in active communities

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
    },
    include: [
      { model: models.Address, as: 'Address' },
      {
        model: models.Thread,
        attributes: ['community_id'],
        where: {
          community_id: { [Op.in]: communityIds },
        },
      },
    ],
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
    userId: user_id!,
    profile: user.profile,
    totalUpvotes,
    addresses: addresses.map((a) => a.toJSON() as ExtendedAddessInstance),
    threads: threads.map(
      (t) => t.toJSON() as unknown as z.infer<typeof ThreadView>,
    ),
    comments: comments.map((c) => c.toJSON()),
    commentThreads: commentThreads.map(
      (c) => c.toJSON() as unknown as z.infer<typeof ThreadView>,
    ),
    isOwner: req.user?.id === user_id,
    tags: profileTags
      .map((t) => t.toJSON())
      .map((t) => (t as ProfileWithTags).Tag),
  });
};

export default getNewProfile;
