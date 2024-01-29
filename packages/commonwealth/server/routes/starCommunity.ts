import { ServerError } from '@hicommonwealth/adapters';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';

export const Errors = {
  FailedToToggle: 'Failed to toggle community star',
};

const starCommunity = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { community } = req;

  try {
    const [star, created] = await models.StarredCommunity.findOrCreate({
      where: {
        community_id: community.id,
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
