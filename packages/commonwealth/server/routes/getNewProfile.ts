import type { NextFunction } from 'express';
import { Op } from 'sequelize';
import type { TypedRequestQuery, TypedResponse } from '../types';
import type { DB } from '../models';
import type { AddressAttributes } from '../models/address';
import type { CommentAttributes } from '../models/comment';
import type { ThreadAttributes } from '../models/thread';
import type { ProfileInstance } from '..//models/profile';
import { success } from '../types';

export const Errors = {
  NoIdentifierProvided: 'No profile id provided in query',
  NoProfileFound: 'No profile found',
};

type GetNewProfileReq = {
  profileId?: string;
};
type GetNewProfileResp = {
  profile: ProfileInstance;
  addresses: AddressAttributes[];
  threads: ThreadAttributes[];
  comments: CommentAttributes[];
  commentThreads: ThreadAttributes[];
  isOwner: boolean;
};

const getNewProfile = async (
  models: DB,
  req: TypedRequestQuery<GetNewProfileReq>,
  res: TypedResponse<GetNewProfileResp>,
  next: NextFunction
) => {
  const { profileId } = req.query;
  let profile;

  if (profileId) {
    profile = await models.Profile.findOne({
      where: {
        id: profileId,
      },
    });
  } else {
    profile = await models.Profile.findOne({
      where: {
        user_id: req.user.id,
      },
    });
  }

  if (!profile) return next(new Error(Errors.NoProfileFound));

  const addresses = await profile.getAddresses({
    include: [
      {
        model: models.Chain,
        required: true,
        where: { active: true },
      },
    ],
  });

  const addressIds = [...new Set<number>(addresses.map((a) => a.id))];
  const threads = await models.Thread.findAll({
    where: {
      address_id: {
        [Op.in]: addressIds,
      },
    },
    include: [
      { model: models.Address, as: 'Address' },
      { model: models.Chain, required: true, where: { active: true } },
    ],
  });

  const comments = await models.Comment.findAll({
    where: {
      address_id: {
        [Op.in]: addressIds,
      },
    },
    include: [
      { model: models.Address, as: 'Address' },
      { model: models.Chain, required: true, where: { active: true } },
    ],
  });

  const commentThreadIds = [
    ...new Set<number>(comments.map((c) => parseInt(c.thread_id, 10))),
  ];
  const commentThreads = await models.Thread.findAll({
    where: {
      id: {
        [Op.in]: commentThreadIds,
      },
    },
    include: [
      {
        model: models.Chain,
        required: true,
        where: { active: true },
      },
    ],
  });

  return success(res, {
    profile,
    addresses: addresses.map((a) => a.toJSON()),
    threads: threads.map((t) => t.toJSON()),
    comments: comments.map((c) => c.toJSON()),
    commentThreads: commentThreads.map((c) => c.toJSON()),
    isOwner: req.user?.id === profile.user_id,
  });
};

export default getNewProfile;
