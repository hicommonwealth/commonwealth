import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import crypto from 'crypto';
import { models } from '../../database';
import { authVerified, mustExist } from '../../middleware';

const TOKEN_EXPIRES_IN = 30;

export function UpdateEmail(): Command<typeof schemas.UpdateEmail> {
  return {
    ...schemas.UpdateEmail,
    auth: [authVerified()],
    secure: true,
    body: async ({ actor, payload }) => {
      const { email } = payload;

      const user = await models.User.scope('withPrivateData').findOne({
        where: { id: actor.user!.id },
      });
      mustExist('User', user);

      const token = crypto.randomBytes(24).toString('hex');
      const expires = new Date(+new Date() + TOKEN_EXPIRES_IN * 60 * 1000);

      return await models.sequelize.transaction(async (transaction) => {
        const eut = await models.EmailUpdateToken.create(
          { email, expires, token },
          { transaction },
        );

        user.email = email;
        user.emailVerified = false;
        await user.save({ transaction });

        return { ...user.toJSON(), email, update_token: eut.token };
      });
    },
  };
}
