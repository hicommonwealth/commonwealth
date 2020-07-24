import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {

};

const mergeAccounts = async (models, req: Request, res: Response, next: NextFunction) => {
    const { oldAddress, newAddress, } = req.body;

    const user = await models.User.findOne({
        where: {
            id: req.user.id,
        },
        // include: [ models.Address, ],
    })

    const addressToBeMerged = await models.Address.findOne({
        where: {
            address: oldAddress,
            user_id: user.id,
        },
        // include: [
        //     { model: models.OffchainProfile, as: 'Profile', },
        //     { model: models.Role, as: 'Roles'},
        // ],
    });

    const threadsToBeMerged = await models.OffchainThreads.findAll({
        where: {
            address_id: addressToBeMerged.id,
        },
    });

    const commentsToBeMerged = await models.OffchainComments.findAll({
        where: {
            address_id: addressToBeMerged.id,
        },
    });

    const rolesToBeMerged = await models.Role.findAll({
        where: {
            address_id: addressToBeMerged.id,
        }
    });

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

    // TODO: What to do with the old Offchain Profile?
    // Keep Address and Offchain Profile in DB, but unassociate with User?
    // Just leave profile page empty (no comments/threads/reactions)?



    return res.json({ status: 'Success', result: 'Here' });
};

export default mergeAccounts;
