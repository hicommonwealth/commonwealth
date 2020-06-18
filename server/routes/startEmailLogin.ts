import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import { SERVER_URL, SENDGRID_API_KEY, LOGIN_RATE_LIMIT_MINS, LOGIN_RATE_LIMIT_TRIES } from '../config';
import { factory, formatFilename } from '../../shared/logging';
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  AlreadyLoggedIn: 'Already logged in',
  NoEmail: 'Missing email',
  InvalidEmail: 'Invalid email',
};

const startEmailLogin = async (models, req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.email) {
    return next(new Error(Errors.AlreadyLoggedIn));
  }

  // validate the email
  const email = req.body.email;
  const validEmailRegex = /\S+@\S+\.\S+/;
  if (!email) {
    return next(new Error(Errors.NoEmail));
  } else if (!validEmailRegex.test(email)) {
    return next(new Error(Errors.InvalidEmail));
  }

  // ensure no more than 3 tokens have been created in the last 5 minutes
  const recentTokens = await models.LoginToken.findAndCountAll({
    where: {
      email,
      created_at: {
        $gte: moment().subtract(LOGIN_RATE_LIMIT_MINS, 'minutes').toDate()
      }
    }
  });
  if (recentTokens.count >= LOGIN_RATE_LIMIT_TRIES) {
    return res.json({
      status: 'Error',
      message: 'You\'ve tried to log in several times already. '
        + `Check your spam folder, or wait ${LOGIN_RATE_LIMIT_MINS} minutes to try again.`
    });
  }

  // create and email the token
  const path = req.body.path;
  const tokenObj = await models.LoginToken.createForEmail(email, path);
  const loginLink = `${SERVER_URL}/api/finishLogin?token=${tokenObj.token}&email=${encodeURIComponent(email)}`;
  const msg = {
    to: email,
    from: 'Commonwealth <no-reply@commonwealth.im>',
    templateId: 'd-2b00abbf123e4b5981784d17151e86be',
    dynamic_template_data: {
      loginLink,
    },
  };
  sgMail.send(msg).then((result) => {
    res.json({ status: 'Success' });
  }).catch((e) => {
    log.error(`Could not send authentication email: ${loginLink}`);
    res.status(500).json({ error: 'Could not send login email', message: e.message });
  });
};

export default startEmailLogin;
