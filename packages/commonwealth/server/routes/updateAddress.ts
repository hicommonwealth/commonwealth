import type { DB } from '@hicommonwealth/model';
import { sequelize } from '@hicommonwealth/model';
import type { Request, Response } from 'express';

export const Errors = {
  NoCommunity: 'Must provide community',
  NoAddress: 'Must provide address',
};

// update ghost address for imported discourse users by new address
const updateAddress = async (models: DB, req: Request, res: Response) => {
  const { address, community } = req;

  const transaction = await sequelize.transaction();
  try {
    if (req.user.id) {
      const { id: ghostAddressId } =
        (await models.Address.scope('withPrivateData').findOne({
          where: {
            community_id: community.id,
            ghost_address: true,
            user_id: req.user.id,
          },
        })) || {};

      const { id: newAddressId } =
        (await models.Address.scope('withPrivateData').findOne({
          where: {
            community_id: community.id,
            user_id: req.user.id,
            address: address.address,
          },
        })) || {};

      if (ghostAddressId && newAddressId) {
        // update address in comments
        await models.Comment.update(
          { address_id: newAddressId },
          { where: { address_id: ghostAddressId }, transaction },
        );

        // update address in reactions
        await models.Reaction.update(
          { address_id: newAddressId },
          { where: { address_id: ghostAddressId }, transaction },
        );

        // update address in threads
        await models.Thread.update(
          { address_id: newAddressId },
          { where: { address_id: ghostAddressId }, transaction },
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
