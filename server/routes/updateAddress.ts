import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB, sequelize } from '../database';
import { Errors } from "./verifyAddress";

const log = factory.getLogger(formatFilename(__filename));

// update ghost address for imported discourse users by new address
const updateAddress = async (models: DB, req: Request, res: Response, next: NextFunction) => {
    const { address, chain } = req.body
    if (!address) {
        return next(new Error(Errors.NoAddress));
    }
    if (!chain) {
        return next(new Error(Errors.NoChain));
    }
    const { id: ghostAddressId } = await models.Address.scope('withPrivateData').findOne({
        where: { chain, ghost_address: true, user_id: req.user.id }
    }) || {};

    const { id: newAddressId } = await models.Address.scope('withPrivateData').findOne({
        where: { chain, user_id: req.user.id, address }
    }) || {};

    try {
        if (ghostAddressId && newAddressId) {
            const transaction = await sequelize.transaction();
            // update address in comments
            await models.OffchainComment.update({ address_id: newAddressId }, { where: { address_id: ghostAddressId }, transaction });

            // update address in reactions
            await models.OffchainReaction.update({ address_id: newAddressId }, { where: { address_id: ghostAddressId }, transaction });

            // update address in threads
            await models.OffchainThread.update({ address_id: newAddressId }, { where: { address_id: ghostAddressId }, transaction });

            // update address in roles
            await models.Role.update({ address_id: newAddressId }, { where: { address_id: ghostAddressId }, transaction });

            // update address in profile
            await models.OffchainProfile.update({ address_id: newAddressId }, { where: { address_id: ghostAddressId }, transaction });

            // delete ghost address from Address
            await models.Address.destroy({ where: { id: ghostAddressId }, transaction });

            return res.json({ status: 'Success', result: 'Ghost Address has been successfully replaced and deleted in all tables' });
        }
        return res.json({}) ;
    } catch (e) {
        return res.json({ status: 'Error', result: e });
        console.log(e);
    }
}

export default updateAddress
