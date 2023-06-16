import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { sequelize } from '../database';
import type { DB } from '../models';

export const Errors = {
  NoChain: 'Must provide chain',
  NoAddress: 'Must provide address',
};

// update ghost address for imported discourse users by new address
const updateAddress = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { address, chain } = req.body;
  if (!address) {
    return next(new AppError(Errors.NoAddress));
  }
  if (!chain) {
    return next(new AppError(Errors.NoChain));
  }
  const transaction = await sequelize.transaction();
  try {
    if (req.user.id) {
      const { id: ghostAddressId } =
        (await models.Address.scope('withPrivateData').findOne({
          where: { chain, ghost_address: true, user_id: req.user.id },
        })) || {};

      const { id: newAddressId } =
        (await models.Address.scope('withPrivateData').findOne({
          where: { chain, user_id: req.user.id, address },
        })) || {};

      if (ghostAddressId && newAddressId) {
        // update address in comments
        await models.Comment.update(
          { address_id: newAddressId },
          { where: { address_id: ghostAddressId }, transaction }
        );

        // update address in reactions
        await models.Reaction.update(
          { address_id: newAddressId },
          { where: { address_id: ghostAddressId }, transaction }
        );

        // update address in threads
        await models.Thread.update(
          { address_id: newAddressId },
          { where: { address_id: ghostAddressId }, transaction }
        );

        // delete ghost address from Address
        await models.Address.destroy({
          where: { id: ghostAddressId },
          transaction,
        });
        await transaction.commit();
        return res.json({
          success: true,
          ghostAddressId,
          newAddressId,
          result:
            'Ghost Address has been successfully replaced and deleted in all tables',
        });
      }
    }
    return res.json('user id or ghost address or new address not found');
  } catch (e) {
    await transaction.rollback();
    console.log(e);
    return res.json({ status: 'Error', result: e });
  }
};

export default updateAddress;
