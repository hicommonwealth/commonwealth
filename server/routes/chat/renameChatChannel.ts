import {NextFunction, Request, Response} from "express";
import {DB} from "../../database";

export const Errors = {
    NotLoggedIn: 'Not logged in',
    NotAdmin: 'Must be an admin to rename a chat channel',
    NoChainId: 'No chain id given',
    NoChannelId: 'No channel id given',
    NoNewName: 'No new name given'
};

export default async (models: DB, req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new Error(Errors.NotLoggedIn));

    // if (!req.user.isAdmin) return next(new Error(Errors.NotAdmin))

    if (!req.body.chain_id) return next(new Error(Errors.NoChainId))

    if (!req.body.channel_id) return next(new Error(Errors.NoChannelId))

    if (!req.body.name) return next(new Error(Errors.NoNewName))

    // finds and renames the channel
    const channel = await models.ChatChannel.findOne({
        where: {
            id: req.body.channel_id,
            chain_id: req.body.chain_id
        }
    });
    channel.name = req.body.name
    await channel.save()

    return res.json({ status: 'Success' });
}
