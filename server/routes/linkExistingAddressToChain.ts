import { Request, Response, NextFunction } from 'express';
import Sequelize from 'sequelize';

const { Op } = Sequelize;

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  NeedOriginChain: 'Must provide original chain',
  NeedLoggedIn: 'Must be logged in',
  NotVerifiedAddressOrUser: 'Not verified address or user',
  InvalidChain: 'Invalid chain',
};

const linkExistingAddressToChain = async (models, req: Request, res: Response, next: NextFunction) => {
  /*
    - general idea:
      this is called when it joins to new chain but already has the address under the same chainbase.
      should be already logged in (req.user is required)
    - example:
      for example, if user logged in to `kusama` and wants to join to `edgeware`, we shouldn't let the user to verify
      his address again. To do so, we should create a new address (chain `edgeware`) marked as verified.
    - edge cases:
      1) in case, the original chain address's token is expired
        We can't mark as verified and let the user to verify his address again.
        Once the user verify his address again, we should update the `verification_token_expires` & `verified` for
        all same chainbase addresses.
      2) in case, the target chain address is existed
        (1) the existing address is owned by this user
          not sure when this happens but in this case, we need to update the verification token with the original one's.
        (2) the existing address is owned by other user
          I think this could happen because the old login flow made the same chainbase addresses are owned by several
          people. (with different chain). In this case, should update the user_id and the verification token.
  */
  if (!req.body.address) {
    return next(new Error(Errors.NeedAddress));
  }
  if (!req.body.chain) {
    return next(new Error(Errors.NeedChain));
  }
  if (!req.body.originChain) {
    return next(new Error(Errors.NeedOriginChain));
  }
  if (!req.user?.id) {
    return next(new Error(Errors.NeedLoggedIn));
  }

  const userId = req.user.id;

  const chain = await models.Chain.findOne({
    where: { id: req.body.chain }
  });
  if (!chain) {
    return next(new Error(Errors.InvalidChain));
  }

  // check if the original address is verified and is owned by the user
  const originalAddress = await models.Address.scope('withPrivateData').findOne({
    where: { chain: req.body.originChain, address: req.body.address, user_id: userId, verified: { [Op.ne]: null } }
  });

  if (!originalAddress) {
    return next(new Error(Errors.NotVerifiedAddressOrUser));
  }

  // check if the original address's token is expired. refer edge case 1)
  const originalExpiration = originalAddress.verification_token_expires;
  const isOriginalExpired = originalExpiration && +originalExpiration <= +(new Date());

  const existingAddress = await models.Address.scope('withPrivateData').findOne({
    where: { chain: req.body.chain, address: req.body.address }
  });

  try {
    let addressId;
    if (existingAddress) {
      // refer edge case 2)
      // either if the existing address is owned by someone else or this user, we can just update with userId. this covers both edge case (1) & (2)
      const updatedObj = await models.Address.updateWithTokenProvided(
        existingAddress,
        userId,
        req.body.keytype,
        originalAddress.verification_token,
        originalAddress.verification_token_expires
      );
      addressId = updatedObj.id;
    } else {
      const newObj = await models.Address.create({
        user_id: originalAddress.user_id,
        address: originalAddress.address,
        chain: req.body.chain,
        verification_token: originalAddress.verification_token,
        verification_token_expires: originalAddress.verification_token_expires,
        verified: originalAddress.verified,
        keytype: originalAddress.keytype,
        name: originalAddress.name,
        last_active: new Date(),
      });

      addressId = newObj.id;
    }

    const ownedAddresses = await models.Address.findAll({
      where: { user_id: originalAddress.user_id }
    });

    await models.Role.create(req.body.community ? {
      address_id: addressId,
      offchain_community_id: req.body.community,
      permission: 'member',
    } : {
      address_id: addressId,
      chain_id: req.body.chain,
      permission: 'member',
    });

    return res.json({
      status: 'Success',
      result: {
        tokenExpired: isOriginalExpired,
        verification_token: originalAddress.verification_token,
        addressId,
        addresses: ownedAddresses
      }
    });
  } catch (e) {
    console.log(e);
    return next(e);
  }
};

export default linkExistingAddressToChain;
