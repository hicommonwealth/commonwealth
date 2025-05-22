import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { mustExist } from '../../middleware';

export function FinishUpdateEmail(): Command<typeof schemas.FinishUpdateEmail> {
  return {
    ...schemas.FinishUpdateEmail,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { token, email } = payload;

      const eut = await models.EmailUpdateToken.findOne({
        where: { token, email },
      });
      mustExist('Email update token', eut);

      const expired = +eut.expires <= +new Date();
      const redirect_path = eut.redirect_path || '/';

      // always consume token immediately if found
      await eut.destroy();
      if (expired) throw new InvalidState('Token expired!');

      // update user object if valid
      const user = await models.User.scope('withPrivateData').findOne({
        where: { email },
      });
      mustExist('User', user);

      user.emailVerified = true;
      await user.save();

      return { redirect_path };
    },
  };
}
