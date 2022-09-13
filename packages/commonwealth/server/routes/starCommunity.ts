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

  try {


  const [star, created] = await models.StarredCommunity.findOrCreate({
    where: {
      chain: chain.id,
      user_id: req.user.id,
    }});

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
