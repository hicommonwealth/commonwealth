import { Request, Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';

export const Errors = {
  NoStarValue: 'Must pass isAlreadyStarred boolean to set starred status',
};

const starCommunity = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));

  if (req.body.isAlreadyStarred === 'false') {
    // star community
    const star = await models.StarredCommunity.create({
      chain: chain.id,
      user_id: req.user.id,
    });
    return res.json({ status: 'Success', result: star.toJSON() });
  } else if (req.body.isAlreadyStarred === 'true') {
    // unstar community
    const star = await models.StarredCommunity.findOne({
      where: { chain: chain.id, user_id: req.user.id },
    });
    if (star) {
      await star.destroy();
    }
    return res.json({ status: 'Success' });
  } else {
    return next(new AppError(Errors.NoStarValue));
  }
};

export default starCommunity;
