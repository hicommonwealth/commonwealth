import { NextFunction, Request, Response } from 'express';
import { DB } from '../../models';
import { AppError } from '../../util/errors';

export const Errors = {
    NotLoggedIn: 'Not logged in',
    NotAdmin: 'Must be an admin to delete a chat channel',
    NoCommunityId: 'No community id given'
};

export default async (models: DB, req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError(Errors.NotLoggedIn));
    }

    if (!req.user.isAdmin) {
        return next(new AppError(Errors.NotAdmin))
    }

    if (!req.body.chain_id) {
        return next(new AppError(Errors.NoCommunityId))
    }

    // delete the channel and cascade delete all of its messages
    await models.ChatChannel.destroy({
        where: {
            id: req.body.channel_id,
            chain_id: req.body.chain_id
        }
    });

    return res.json({ status: 'Success' });
}
