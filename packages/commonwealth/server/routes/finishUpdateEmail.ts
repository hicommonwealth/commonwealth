import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { TypedRequest, TypedResponse } from 'server/types';

type finishUpdateEmailReq = {
  token: string;
  email: string;
};

const finishUpdateEmail = async (
  models: DB,
  req: TypedRequest<finishUpdateEmailReq>,
  res: TypedResponse<void>,
) => {
  // fetch token and confirm validity

  const { token, email } = req.query;
  if (!token || !email) {
    throw new AppError('Invalid arguments');
  }
  const tokenObj = await models.EmailUpdateToken.findOne({
    where: { token, email },
  });
  if (!tokenObj) throw new AppError('Not found');
  const isExpired = +tokenObj.expires <= +new Date();
  const redirectPath = tokenObj.redirect_path || '/';

  // always consume token immediately if found
  await tokenObj.destroy();
  if (isExpired) throw new AppError('Token expired!');

  // update user object if valid
  const user = await models.User.scope('withPrivateData').findOne({
    where: { email },
  });
  if (user) {
    user.emailVerified = true;
    await user.save();
    return res.redirect(redirectPath);
  } else {
    throw new AppError('User not found');
  }
};

export default finishUpdateEmail;
