import { NextFunction, Request, Response } from 'express';
import { DB } from '../../database';
import { AppError, ServerError } from '../../util/errors';

export const Errors = {
	NoChannelId: 'No channel id given'
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
	// check channel id
	if (!req.query.channel_id) {
		return next(new AppError(Errors.NoChannelId))
	}

  const channel = await models.ChatChannel.findOne({
    where: {
      id: req.query.channel_id
    }
  })

	return res.json({ status: '200', result: JSON.stringify(channel)});
}
