import { Request, Response, NextFunction } from 'express';
import { SERVER_URL } from '../config';
import { NotificationCategories } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
import { redirectWithLoginSuccess, redirectWithLoginError } from './finishEmailLogin';

const log = factory.getLogger(formatFilename(__filename));

const finishOAuthLogin = async (models, req: Request, res: Response, next: NextFunction) => {
  const token = req.query.token;
  if (!token) {
    return redirectWithLoginError(res, 'Missing token');
  }

  // Clear any previous login
  if (req.user) {
    req.logout();
  }

  // Validate login token
  const tokenObj = await models.LoginToken.findOne({ where: { token } });
  if (!tokenObj) {
    return redirectWithLoginError(res, 'Invalid token');
  }
  if (+new Date() >= +tokenObj.expires) {
    return redirectWithLoginError(res, 'Token expired');
  }

  // If we are already on the correct domain, continue to log in any
  // social account associated with the LoginToken. Otherwise redirect
  const hostname = req.headers['x-forwarded-host'] || req.hostname;
  if (tokenObj.domain !== hostname) {
    return res.redirect(`https://${tokenObj.domain}/api/finishOAuthLogin?token=${token}`);
  }

  // Mark LoginToken as used
  tokenObj.used = true;
  await tokenObj.save();

  // Log in the user associated with the verified email,
  // or create a new user if none exists
  const socialAccount = await models.SocialAccount.findOne({ where: { login_token_id: tokenObj.id } });
  const existingUser = await models.User.scope('withPrivateData').findOne({ where: { id: socialAccount.user_id } });

  if (existingUser) {
    req.login(existingUser, async (err) => {
      if (err) return redirectWithLoginError(res, 'Could not log in with OAuth user');
      return res.redirect('/?loggedin=true&confirmation=success');
    });
  } else {
    const newUser = await models.User.create({ email: null });

    // Automatically create subscription to their own mentions
    await models.Subscription.create({
      subscriber_id: newUser.id,
      category_id: NotificationCategories.NewMention,
      object_id: `user-${newUser.id}`,
      is_active: true,
    });

    // Automatically create a subscription to collaborations
    await models.Subscription.create({
      subscriber_id: newUser.id,
      category_id: NotificationCategories.NewCollaboration,
      object_id: `user-${newUser.id}`,
      is_active: true,
    });

    req.login(newUser, (err) => {
      if (err) return redirectWithLoginError(res, 'Could not log in with OAuth user');
      return res.redirect('/?loggedin=true&confirmation=success');
    });
  }
};

export default finishOAuthLogin;
