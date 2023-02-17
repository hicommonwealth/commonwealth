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
  NoAddressProvided: 'No address provided in query',
  NoAddressFound: 'No address found',
  NoProfileFound: 'No profile found',
};

type GetNewProfileReq = { address: string };
type GetNewProfileResp = {
  profile: ProfileInstance;
  addresses: AddressAttributes[];
  threads: ThreadAttributes[];
  comments: CommentAttributes[];
  commentThreads: ThreadAttributes[];
};

const getNewProfile = async (
  models: DB,
  req: TypedRequestQuery<GetNewProfileReq>,
  res: TypedResponse<GetNewProfileResp>,
  next: NextFunction
) => {
  const { address } = req.query;
  if (!address) return next(new Error(Errors.NoAddressProvided));

  const addressModel = await models.Address.findOne({
    where: {
      address,
    },
    include: [{ model: models.Profile, required: true }],
  });
  if (!addressModel) return next(new Error(Errors.NoAddressFound));

  const profile = await addressModel.getProfile();
  if (!profile) return next(new Error(Errors.NoProfileFound));

  const addresses = await models.Address.findAll({
    where: {
      profile_id: profile.id,
    },
    include: [models.Chain],
  });

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
  });
};

export default getNewProfile;
