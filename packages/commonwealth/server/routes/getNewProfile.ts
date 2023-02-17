import type { NextFunction } from 'express';
import { Op } from 'sequelize';
import type { AddressAttributes } from 'server/models/address';
import type { CommentAttributes } from 'server/models/comment';
import type { ProfileInstance } from 'server/models/profile';
import type { ThreadAttributes } from 'server/models/thread';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';
import type { DB } from '../models';

export const Errors = {
  NoIdentifierProvided: 'No username or profile id provided in query',
  NoProfileFound: 'No profile found',
};

type GetNewProfileReq = {
  username: string;
  profileId: string;
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
  const { username, profileId } = req.query;
  if (!username && !profileId)
    return next(new Error(Errors.NoIdentifierProvided));

  let profile;

  if (username) {
    profile = await models.Profile.findOne({
      where: {
        username,
      },
    });
  }

  if (!username && profileId) {
    profile = await models.Profile.findOne({
      where: {
        id: profileId,
      },
    });
  }

  if (!profile) return next(new Error(Errors.NoProfileFound));

  const addresses = await profile.getAddresses();

  const addressIds = [...new Set<number>(addresses.map((a) => a.id))];
  const threads = await models.Thread.findAll({
    where: {
      address_id: {
        [Op.in]: addressIds,
      },
    },
    include: [{ model: models.Address, as: 'Address' }],
  });

  const comments = await models.Comment.findAll({
    where: {
      address_id: {
        [Op.in]: addressIds,
      },
    },
    include: [{ model: models.Address, as: 'Address' }],
  });

  const commentThreadIds = [
    ...new Set<number>(
      comments.map((c) => parseInt(c.root_id.replace('discussion_', ''), 10))
    ),
  ];
  const commentThreads = await models.Thread.findAll({
    where: {
      id: {
        [Op.in]: commentThreadIds,
      },
    },
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
