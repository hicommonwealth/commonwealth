import { NextFunction, Request, Response } from 'express';
import { DB } from '../../models';
import { AppError, ServerError } from 'common-common/src/errors';

export const Errors = {
    NotLoggedIn: 'Not logged in',
    NotAdmin: 'Must be an admin to edit a chat category',
    NoCommunityId: 'No community id given',
    NoCategory: 'No category given',
    NoNewCategory: 'No new category name given'
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

    if (!req.body.category) {
        return next(new AppError(Errors.NoCategory))
    }

    if (!req.body.new_category) {
        return next(new AppError(Errors.NoNewCategory))
    }

    // finds all channels with category and renames category
    const channels = await models.ChatChannel.findAll({
        where: {
            chain_id: req.body.chain_id,
            category: req.body.category
        }
    });

    try {
        await Promise.all(channels.map(c => {c.category = req.body.new_category; return c.save()}))
    } catch (e) {
        return next(new ServerError(e))
    }

    return res.json({ status: 'Success' });
}
