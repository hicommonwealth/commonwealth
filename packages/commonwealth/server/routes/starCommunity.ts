import { ServerError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';

export const Errors = {
  NoStarValue: 'Must pass isAlreadyStarred boolean to set starred status',
};

const starCommunity = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { community } = req;

  try {
    const [star] = await models.StarredCommunity.findOrCreate({
      where: {
        chain: community.id,
        user_id: req.user.id,
      },
    });

    if (req.body.isAlreadyStarred === 'true') {
      await star.destroy();
      return res.json({ status: 'Success' });
    }

    return res.json({ status: 'Success', result: star.toJSON() });
  } catch (err) {
    return next(new ServerError(Errors.NoStarValue));
  }
};

export default starCommunity;
