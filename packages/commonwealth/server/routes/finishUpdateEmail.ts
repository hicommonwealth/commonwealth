import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';

const finishUpdateEmail = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // fetch token and confirm validity
  const token = req.query.token;
  const email = req.query.email;
  const tokenObj = await models.EmailUpdateToken.findOne({
    where: { token, email },
  });
  if (!tokenObj) return next(new AppError('Not found'));
  const isExpired = +tokenObj.expires <= +new Date();
  const redirectPath = tokenObj.redirect_path || '/';

  // always consume token immediately if found
  await tokenObj.destroy();
  if (isExpired) return next(new AppError('Token expired!'));

  // update user object if valid
  const user = await models.User.scope('withPrivateData').findOne({
    where: { email },
  });
  if (user) {
    user.emailVerified = true;
    await user.save();
    return res.redirect(redirectPath);
  } else {
    return next(new AppError('User not found'));
  }
};

export default finishUpdateEmail;
