import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';

export const Errors = {
  InvalidUpdate: 'Invalid update',
  NoProfileFound: 'No profile found',
  NoAddressFound: 'No address found',
  NoAddressProvided: 'No address provided in query',
}

const updateNewProfile = async (
  models: DB, req: Request, res: Response, next: NextFunction
) => {

  console.log("SERVERSIDEEEE", req)

  if (!req.body.address) {
    return next(new Error(Errors.NoAddressProvided));
  }

  if (!req.body.email && !req.body.slug && !req.body.bio && !req.body.website && !req.body.avatarUrl) {
    return next(new Error(Errors.InvalidUpdate));
  }

  const { address, email, slug, bio, website, avatarUrl } = req.body;

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

  const profileUpdate = await models.Profile.update({
    bio
    }, 
      {
        where: {
        id: profile.id
      }
  })

  console.log("SERVER SIDEEEEEE")

  return res.json({ 
    status: 'Success', 
    result: { profile: profileUpdate } 
  });
}

export default updateNewProfile;