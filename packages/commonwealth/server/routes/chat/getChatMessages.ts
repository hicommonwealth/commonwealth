import { NextFunction, Request, Response } from 'express';
import { DB } from '../../models';
import { AppError } from '../../util/errors';

export const Errors = {
	NotLoggedIn: 'Not logged in',
	NoValidAddress: 'No valid address',
	NoCommunityId: 'No community id given'
};

/**
 * Gets all relevant messages of a community. A user must be logged in, and they must have a valid address in the
 * community whose chat messages they are trying to view.
 * @param models
 * @param req
 * @param res
 * @param next
 */
export default async (models: DB, req: Request, res: Response, next: NextFunction) => {
	if (!req.user) {
		return next(new AppError(Errors.NotLoggedIn));
	}

	// check address
	const addressAccount = await models.Address.findOne({
		where: {
			address: req.query.address,
			user_id: req.user.id
		}
	});
	if (!addressAccount) {
		return next(new AppError(Errors.NoValidAddress))
	}

	// check community id
	if (!req.query.chain_id) {
		return next(new AppError(Errors.NoCommunityId))
	}

	// get all messages
	const messages = await models.ChatChannel.findAll({
		where: {
			chain_id: req.query.chain_id
		},
		include: {
			model: models.ChatMessage,
			required: false // should return channels with no chat messages
		}
	})

	return res.json({ status: '200', result: JSON.stringify(messages) });
}
