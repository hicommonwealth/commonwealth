import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import { SERVER_URL, SENDGRID_API_KEY, LOGIN_RATE_LIMIT_MINS, LOGIN_RATE_LIMIT_TRIES } from '../config';
import { factory, formatFilename } from '../../shared/logging';
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoEmail: 'Must provide email',
  InvalidChain: 'Invalid chain',
  AlreadyRegisterd: 'Already registered',
  InvalidEmail: 'Invalid email',
};

const registerWaitingList = async (models, req: Request, res: Response, next: NextFunction) => {
  const email = req.body.email;
  const address = req.body.address;
  const chain = await models.Chain.findOne({ where: { id: req.body.chain }});
  const existingUser = await models.User.findOne({ where: { email } });
  // TODO: Check if the address already exists
  // TODO: Check if it conforms to the public key format for he chain
  if (!req.body.email) {
    return next(new Error(Errors.NoEmail));
  }
  if (!chain) {
    return next(new Error(Errors.InvalidChain));
  }

  if (existingUser) {
    const existingRegistration = await models.WaitlistRegistration.findOne({ where: {
      user_id: existingUser.id,
      chain_id: chain.id,
    }});
    if (existingRegistration) {
      // existing user, already on waitlist
      return next(new Error(Errors.AlreadyRegisterd));
    } else {
      // existing user, add to waitlist
      const newRegistration = await models.WaitlistRegistration.create({
        user_id: existingUser.id,
        chain_id: chain.id,
      });
      return res.json({ status: 'Success', result: newRegistration.toJSON() });
    }
  } else {
    // new user, new waitlist entry
    const newUser = await models.User.create({ email: null });
    const newRegistration = await models.WaitlistRegistration.create({
      user_id: newUser.id,
      chain_id: chain.id,
    });

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
        message: `You've tried to register several times already. ` +
          `Check your spam folder, or wait ${LOGIN_RATE_LIMIT_MINS} minutes to try again.`
      });
    }

    const validEmailRegex = /\S+@\S+\.\S+/;
    if (!email) {
      return next(new Error(Errors.NoEmail));
    } else if (!validEmailRegex.test(email)) {
      return next(new Error(Errors.InvalidEmail));
    }
    const tokenObj = await models.LoginToken.createForEmail(email);
    const registrationLink = SERVER_URL + `/api/finishLogin?token=${tokenObj.token}&email=${email}`;
    const msg = {
      to: email,
      from: 'Commonwealth <no-reply@commonwealth.im>',
      subject: `Staying updated to ${chain.name} on Commonwealth`,
      text: `Use this link to complete registration: ${registrationLink}`,
      html: `You've signed up to be notified when ${chain.name} governance launches on Commonwealth.
<a href="${registrationLink}">Click here to confirm your email.</a>.<br/><br/>
Or copy and paste this link into your browser: ${registrationLink}`,
    };
    sgMail.send(msg).then((result) => {
      res.json({ status: 'Success' });
    }).catch((e) => {
      log.error(`Could not send registration email: ${registrationLink}`);
      res.status(500).json({ error: 'SendGrid error', message: e.message });
    });
  }
};

export default registerWaitingList;
