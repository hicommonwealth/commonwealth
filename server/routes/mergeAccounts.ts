import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
import role from '../models/role';
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
    await Promise.all(
        threadsToBeMerged.map((thread) => {
            return thread.update({
                address_id: addressToBeOwner.id,
            });
        })
    );

    // Transfer Comments
    await Promise.all(
        commentsToBeMerged.map((comment) => {
            return comment.update({
                address_id: addressToBeOwner.id,
            });
        })
    )

    // Transfer Roles
    await Promise.all(
        rolesToBeMerged.map((role) => {
            return role.update({
                address_id: addressToBeOwner.id,
            });
        })
    );
    // Prune Roles
    const allRoles = await models.Role.findAll({
        where: {
            address_id: addressToBeOwner.id,
        },
    });
    for (let i=0; i<allRoles.length-1; i++) {
        const role1 = allRoles[i];
        for (let j=i+1; j<allRoles.length; j++) {
            const role2 = allRoles[j];
            // compare
            const compare = role1.chain_id
                ? role1.chain_id === role2.chain_id
                : role1.community_id === role2.community_id
            if (compare) {
                    // destroy the model with the lowest permission
                    if (role1.permission === 'admin'
                        || (role1.permission === 'moderator' && role2.permission !== 'admin')
                    ) {
                        await role2.destroy();
                    } else if (role2.permission === 'admin'
                        || (role2.permission === 'moderator' && role1.permission !== 'admin')
                    ) {
                        await role1.destroy();
                    }
                }
        }
    }

    // TODO: What to do with the old Offchain Profile?
    // Keep Address and Offchain Profile in DB, but unassociate with User?
    // Just leave profile page empty (no comments/threads/reactions)?



    return res.json({ status: 'Success', result: 'Here' });
};

export default mergeAccounts;
