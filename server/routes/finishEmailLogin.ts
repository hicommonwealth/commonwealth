import { Request, Response, NextFunction } from 'express';
import { NotificationCategories } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
import { getStatsDInstance } from '../util/metrics';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const redirectWithLoginSuccess = (res, email, path?, confirmation?, newAcct = false) => {
  // Returns new if we are creating a new account
  if (res?.user?.id) {
    getStatsDInstance().set('cw.users.unique', res.user.id);
  }
  getStatsDInstance().increment('cw.users.logged_in');
  const url = `/?loggedin=true&email=${email}&new=${newAcct}${path ? `&path=${encodeURIComponent(path)}` : ''}${confirmation ? '&confirmation=success' : ''}`;
  return res.redirect(url);
};

export const redirectWithLoginError = (res, message) => {
  const url = `/?loggedin=false&loginerror=${encodeURIComponent(message)}`;
  return res.redirect(url);
};

const finishEmailLogin = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const previousUser = req.user;
  if (req.user && req.user.email && req.user.emailVerified) {
    return redirectWithLoginSuccess(res, req.user.email);
  }
  const token = req.query.token;
  const email = <string>req.query.email;
  const confirmation = req.query.confirmation;
  if (!token) {
    return redirectWithLoginError(res, 'Missing token');
  }
  if (!email) {
    return redirectWithLoginError(res, 'Missing email');
  }

  // Validate login token, and mark as used
  const tokenObj = await models.LoginToken.findOne({ where: { token, email } });
  if (!tokenObj) {
    return redirectWithLoginError(res, 'Invalid token');
  }
  if (+new Date() >= +tokenObj.expires) {
    return redirectWithLoginError(res, 'Token expired');
  }
  tokenObj.used = new Date();
  await tokenObj.save();

  // Log in the user associated with the verified email
  const existingUser = await models.User.scope('withPrivateData').findOne({ where: { email } });

  if (existingUser) {
    req.login(existingUser, async (err) => {
      if (err) return redirectWithLoginError(res, 'Could not log in with user at ' + email);
      // If the user is currently in a partly-logged-in state, merge their
      // social accounts over to the newly found user
      if (previousUser && previousUser.id !== existingUser.id) {
        const [oldSocialAccounts, oldAddresses,
               newSocialAccounts, newAddresses] = await Promise.all([
          previousUser.getSocialAccounts(),
          (await previousUser.getAddresses()).filter((address) => !!address.verified),
          existingUser.getSocialAccounts(),
          (await existingUser.getAddresses()).filter((address) => !!address.verified),
        ]);
        await existingUser.setSocialAccounts(oldSocialAccounts.concat(newSocialAccounts));
        await existingUser.setAddresses(oldAddresses.concat(newAddresses));
      }
      if (!existingUser.emailVerified) {
        existingUser.emailVerified = true;
        await existingUser.save();
      }
      return redirectWithLoginSuccess(res, email, tokenObj.redirect_path, confirmation);
    });
  } else if (previousUser && !previousUser.email) {
    // If the user is an partly-logged-in state, but the email is new, just set that user's email.
    await previousUser.setEmail(email);
    previousUser.emailVerified = true;
    await previousUser.save();
    req.login(previousUser, (err) => {
      if (err) return redirectWithLoginError(res, 'Could not log in with user at ' + email);
      return redirectWithLoginSuccess(res, email, tokenObj.redirect_path, confirmation);
    });
  } else {
    // If the user isn't in a partly-logged-in state, create a new user
    const newUser = await models.User.create({
      email,
      emailVerified: true,
    });

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
      if (err) return redirectWithLoginError(res, 'Could not log in with user at ' + email);
      return redirectWithLoginSuccess(res, email, tokenObj.redirect_path, confirmation, true);
    });
  }
};

export default finishEmailLogin;
