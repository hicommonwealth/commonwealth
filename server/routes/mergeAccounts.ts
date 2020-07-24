import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
    AddressesNotOwned: 'User does not own both addresses',
};

const mergeAccounts = async (models, req: Request, res: Response, next: NextFunction) => {
    const { oldAddress, newAddress, } = req.body;

    // get User model with Addresses
    const user = await models.User.findOne({
        where: {
            id: req.user.id,
        },
        include: [ {model: models.Address, as: 'userAddressModels', }, ],
    });

    // Check addresses are owned by User
    const { userAddressModels } = user;
    const userAddresses = userAddressModels.map((a) => a.id);
    if (!userAddresses.includes(oldAddress) || !userAddresses.includes(newAddress)) {
        return next(new Error(Errors.AddressesNotOwned))
    }

    // Get "To be merged" Address Model with its Profile
    const addressToBeMerged = await models.Address.findOne({
        where: {
            address: oldAddress,
            user_id: user.id,
        },
        include: [
            { model: models.OffchainProfile, as: 'Profile', },
        ],
    });

    // Get threads to be transfered
    const threadsToBeMerged = await models.OffchainThreads.findAll({
        where: {
            address_id: addressToBeMerged.id,
        },
    });

    // Get comments to be transfered
    const commentsToBeMerged = await models.OffchainComments.findAll({
        where: {
            address_id: addressToBeMerged.id,
        },
    });

    // Get roles to be transfered
    const rolesToBeMerged = await models.Role.findAll({
        where: {
            address_id: addressToBeMerged.id,
        }
    });

    // Get Address to be new owner
    const addressToBeOwner = await models.Address.findOne({
        where: {
            address: newAddress,
            user_id: user.id,
        },
        include: [
            { model: models.OffchainProfile, as: 'Profile', },
            { model: models.Role, as: 'Roles'},
        ],
    });

    // Transfer Threads

    // Transfer Comments

    // Transfer Roles (Delete role if address already has role of greater permission)

    // TODO: What to do with the old Offchain Profile?
    // Keep Address and Offchain Profile in DB, but unassociate with User?
    // Just leave profile page empty (no comments/threads/reactions)?



    return res.json({ status: 'Success', result: 'Here' });
};

export default mergeAccounts;
