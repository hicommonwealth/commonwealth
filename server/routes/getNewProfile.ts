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

  const profile = await models.Profile.findOne({
    where: {
      id: addressModel.profile_id,
    },
  });
  if (!profile) return next(new Error(Errors.NoProfileFound));

  const addresses = await models.Address.findAll({
    where: {
      profile_id: profile.id,
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

  const addressIds = [...new Set<number>(addresses.map(a => a.id))]
  const threads = await models.OffchainThread.findAll({
    where: {
      address_id: {
        [Op.in]: addressIds,  
      },  
    },
    include: [ { model: models.Address, as: 'Address' } ],
  });

  const comments = await models.OffchainComment.findAll({
    where: {
      address_id: {
        [Op.in]: addressIds,  
      },  
    },
    include: [ { model: models.Address, as: 'Address' } ],
  });

  const socialAccounts = await models.SocialAccount.findAll({
    where: {
      user_id: profile.user_id
    },
    attributes: { exclude: ['user_id'] },
  })

  return res
    .status(200)
    .json({
      profile,
      addresses: addresses.map(a => a.toJSON()),
      threads: threads.map(t => t.toJSON()), 
      comments: comments.map(c => c.toJSON()),
      chains: chains.map(c => c.toJSON()),
      socialAccounts: socialAccounts.map(s => s.toJSON()),
    })
}

export default getNewProfile;
