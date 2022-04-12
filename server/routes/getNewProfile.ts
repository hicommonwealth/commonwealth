import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));
import { DB } from '../database';

export const Errors = {
  NoAddressProvided: 'No address provided in query',
  NoAddressFound: 'No address found',
  NoProfileFound: 'No profile found',
};

const getNewProfile = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const { address } = req.query;
  if (!address) return next(new Error(Errors.NoAddressProvided));

  const addressModel = await models.Address.findOne({
    where: {
      address,
    },
    include: [ models.OffchainProfile, ],
  });
  if (!addressModel) return next(new Error(Errors.NoAddressFound));

  const profileModel = await models.Profile.findOne({
    where: {
      id: addressModel.profile_id,
    },
  });
  if (!profileModel) return next(new Error(Errors.NoProfileFound));

  const addresses = await models.Address.findAll({
    where: {
      profile_id: profileModel.id,
    }
  })

  const chainIds = [... new Set<string>(addresses.map(a => a.chain))]
  const chains = await models.Chain.findAll({
    where: {
      id: {
        [Op.in]: chainIds,
      },
    }
  })

  const threads = await models.OffchainThread.findAll({
    where: {
      address_id: addressModel.id
    },
    include: [ { model: models.Address, as: 'Address' } ],
  });

  const comments = await models.OffchainComment.findAll({
    where: {
      address_id: addressModel.id,
    },
  });

  return res
    .status(200)
    .json({
      profile: profileModel,
      addresses: addresses.map((a) => a.toJSON()),
      threads: threads.map((t) => t.toJSON()), 
      comments: comments.map((c) => c.toJSON()),
      chains: chains.map((c) => c.toJSON()),
    })
}

export default getNewProfile;