import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { DynamicTemplate, PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import { config } from '../../config';
import { models } from '../../database';
import { authVerified, mustExist } from '../../middleware';

const TOKEN_EXPIRES_IN = 30;
config.SENDGRID.API_KEY && sgMail.setApiKey(config.SENDGRID.API_KEY);

const notifyUpdateEmail = async ({
  email,
  update_token,
}: {
  email: string;
  update_token: string;
}) => {
  const loginLink = `${config.SERVER_URL}/api/finishUpdateEmail?token=${
    update_token
  }&email=${encodeURIComponent(email)}`;

  const msg = {
    to: email,
    from: `Commonwealth <no-reply@${PRODUCTION_DOMAIN}>`,
    subject: 'Verify your Commonwealth email',
    templateId: DynamicTemplate.UpdateEmail,
    dynamic_template_data: { loginLink },
  };
  await sgMail.send(msg);
};

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

        await notifyUpdateEmail({ email, update_token: eut.token });

        user.email = email;
        user.emailVerified = false;
        await user.save({ transaction });

        return { ...user.toJSON(), email };
      });
    },
  };
}
