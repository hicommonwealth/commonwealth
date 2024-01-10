import { ServerError } from '@hicommonwealth/adapters';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';

export const Errors = {
  FailedToToggle: 'Failed to toggle community star',
};

const starCommunity = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const chain = req.chain;

  try {
    const [star, created] = await models.StarredCommunity.findOrCreate({
      where: {
        community_id: chain.id,
        user_id: req.user.id,
      },
    });

    if (!created) {
      await star.destroy();
      return res.json({ status: 'Success' });
    }

    return res.json({ status: 'Success', result: star.toJSON() });
  } catch (err) {
    return next(new ServerError(Errors.FailedToToggle));
  }
};

export default starCommunity;
