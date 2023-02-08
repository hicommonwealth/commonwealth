import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { DB } from '../models';

export const Errors = {
  NoAddressProvided: 'No address provided in query',
  NoAddressFound: 'No address found',
  NoProfileFound: 'No profile found',
};

const getNewProfile = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { address } = req.query;
  if (!address) return next(new Error(Errors.NoAddressProvided));

  const addressModel = await models.Address.findOne({
    where: {
      address,
    },
    include: [models.Profile],
  });
  if (!addressModel) return next(new Error(Errors.NoAddressFound));

  const profile = await models.Profile.findOne({
    where: {
      id: addressModel.profile_id,
    },
  });
  if (!profile) return next(new Error(Errors.NoProfileFound));

  const addresses = await models.Address.findAll({
    where: {
      profile_id: profile.id,
    },
  });

  const chainIds = [...new Set<string>(addresses.map((a) => a.chain))];
  const chains = await models.Chain.findAll({
    where: {
      id: {
        [Op.in]: chainIds,
      },
    },
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

  return res.status(200).json({
    profile,
    addresses: addresses.map((a) => a.toJSON()),
    threads: threads.map((t) => t.toJSON()),
    comments: comments.map((c) => c.toJSON()),
    commentThreads: commentThreads.map((c) => c.toJSON()),
    chains: chains.map((c) => c.toJSON()),
  });
};

export default getNewProfile;
