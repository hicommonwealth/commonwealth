import { NotificationCategories } from 'common-common/src/types';
import type { Request, Response } from 'express';
import { MixpanelLoginEvent } from '../../shared/analytics/types';
import type { DB } from '../models';
import { redirectWithLoginError } from './finishEmailLogin';
import { serverAnalyticsTrack } from '../../shared/analytics/server-track';

const finishOAuthLogin = async (models: DB, req: Request, res: Response) => {
  const token = req.query.token;
  if (!token) {
    return redirectWithLoginError(res, 'Missing token');
  }

  // Clear any previous login
  if (req.user) {
    req.logout();
  }

  // Validate login token
  const tokenObj = await models.LoginToken.findOne({
    where: { token, email: '' },
  });
  if (!tokenObj || !tokenObj.social_account) {
    return redirectWithLoginError(res, 'Invalid token');
  }
  if (+new Date() >= +tokenObj.expires) {
    return redirectWithLoginError(res, 'Token expired');
  }

  // If we are already on the correct domain, continue to log in any
  // social account associated with the LoginToken. Otherwise redirect
  // to the correct domain
  const hostname = req.headers['x-forwarded-host'] || req.hostname;
  if (tokenObj.domain !== hostname) {
    return res.redirect(
      `https://${tokenObj.domain}/api/finishOAuthLogin?token=${token}`
    );
  }

  // Mark LoginToken as used
  tokenObj.used = new Date();
  await tokenObj.save();

  // Log in the user associated with the verified email,
  // or create a new user if none exists
  const socialAccount = await models.SocialAccount.findOne({
    where: { id: tokenObj.social_account },
  });
  const existingUser = await socialAccount.getUser({
    scope: 'withPrivateData',
  });

  if (existingUser) {
    req.login(existingUser, async (err) => {
      if (err) {
        serverAnalyticsTrack({
          event: MixpanelLoginEvent.LOGIN_FAILED,
          isCustomDomain: null,
        });
        return redirectWithLoginError(res, 'Could not log in with OAuth user');
      }
      serverAnalyticsTrack({
        event: MixpanelLoginEvent.LOGIN_COMPLETED,
        isCustomDomain: null,
      });

      return res.redirect('/?loggedin=true&confirmation=success');
    });
  } else {
    const newUser = await models.User.createWithProfile(models, {
      email: null,
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
      if (err) {
        serverAnalyticsTrack({
          event: MixpanelLoginEvent.LOGIN_FAILED,
          isCustomDomain: null,
        });
        return redirectWithLoginError(res, 'Could not log in with OAuth user');
      }
      serverAnalyticsTrack({
        event: MixpanelLoginEvent.LOGIN_COMPLETED,
        isCustomDomain: null,
      });

      return res.redirect('/?loggedin=true&confirmation=success');
    });
  }
};

export default finishOAuthLogin;
