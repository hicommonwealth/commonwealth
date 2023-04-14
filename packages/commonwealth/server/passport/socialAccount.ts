import type { DB } from '../models';
import { NotificationCategories } from 'common-common/src/types';
import type { Request } from 'express';
import passport from 'passport';
import passportDiscord from 'passport-discord';
import passportGithub from 'passport-github2'; // passport-github is not up to date with Github OAuth 3.0
import {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_OAUTH_CALLBACK,
  DISCORD_OAUTH_SCOPES,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_OAUTH_CALLBACK,
} from '../config';

import '../types';

/**
 * The OAuth 2.0 authentication strategy authenticates requests using the OAuth
 * 2.0 framework.
 *
 * OAuth 2.0 provides a facility for delegated authentication, whereby users can
 * authenticate using a third-party service such as Facebook.  Delegating in
 * this manner involves a sequence of events, including redirecting the user to
 * the third-party service for authorization.  Once authorization has been
 * granted, the user is redirected back to the application and an authorization
 * code can be used to obtain credentials.
 *
 * Applications must supply a `verify` callback, for which the function
 * signature is:
 *
 *     function(accessToken, refreshToken, profile, done) { ... }
 *
 * The verify callback is responsible for finding or creating the user, and
 * invoking `done` with the following arguments:
 *
 *     done(err, user, info);
 *
 * `user` should be set to `false` to indicate an authentication failure.
 * Additional `info` can optionally be passed as a third argument, typically
 * used to display informational messages.  If an exception occurred, `err`
 * should be set.
 *
 * Options:
 *
 *   - `authorizationURL`  URL used to obtain an authorization grant
 *   - `tokenURL`          URL used to obtain an access token
 *   - `clientID`          identifies client to service provider
 *   - `clientSecret`      secret used to establish ownership of the client identifer
 *   - `callbackURL`       URL to which the service provider will redirect the user after obtaining authorization
 *   - `passReqToCallback` when `true`, `req` is the first argument to the verify callback (default: `false`)
 *
 * Examples:
 *
 *     passport.use(new OAuth2Strategy({
 *         authorizationURL: 'https://www.example.com/oauth2/authorize',
 *         tokenURL: 'https://www.example.com/oauth2/token',
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/example/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 */

enum Providers {
  GITHUB = 'github',
  DISCORD = 'discord',
}

const GithubStrategy = passportGithub.Strategy;
const DiscordStrategy = passportDiscord.Strategy;

async function authenticateSocialAccount(
  provider: Providers,
  req: Request,
  accessToken,
  refreshToken,
  profile,
  cb,
  models: DB
) {
  const account = await models.SocialAccount.findOne({
    where: { provider, provider_userid: profile.id },
  });

  // Existing account. If there is already a user logged-in,
  // transfer the link to the current user.
  if (account !== null) {
    // Handle OAuth for custom domains.
    //
    // If req.query.from is a valid custom domain for a community,
    // associate our LoginToken with this Github account. We will
    // redirect to [customdomain] afterwards and consume this
    // LoginToken to get a new login session.
    if ((req as any).loginTokenForRedirect) {
      const tokenObj = await models.LoginToken.findOne({
        where: { id: (req as any).loginTokenForRedirect },
      });
      tokenObj.social_account = account.id;
      await tokenObj.save();
    }

    // Update profile data on the SocialAccount.
    if (
      accessToken !== account.access_token ||
      refreshToken !== account.refresh_token ||
      profile.username !== account.provider_username
    ) {
      account.access_token = accessToken;
      account.refresh_token = refreshToken;
      account.provider_username = profile.username;
      await account.save();
    }

    // Check associations and log in the correct user.
    const user = await account.getUser();
    if (req.user === null && user === null) {
      const newUser = await models.User.createWithProfile(models, {
        email: null,
      });
      await account.setUser(newUser);
      return cb(null, newUser);
    } else if (req.user && req.user !== user) {
      // Github user has a user attached, and we're logged in to
      // a different user. Log out the previous user.
      req.logout();
      return cb(null, user);
    } else {
      // Github account has a user attached, and we either aren't
      // logged in, or we're already logged in to that account.
      return cb(null, user);
    }
  }

  // New account. Either link it to the existing user, or
  // create a new user. As a result it's possible that we end up
  // with a user with multiple social accounts linked.
  const newAccount = await models.SocialAccount.create({
    provider,
    provider_userid: profile.id,
    provider_username: profile.username,
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Handle OAuth for custom domains.
  //
  // If req.query.from is a valid custom domain for a community,
  // associate our LoginToken with this Github account. We will
  // redirect to [customdomain] afterwards and consume this
  // LoginToken to get a new login session.
  if ((req as any).loginTokenForRedirect) {
    const tokenObj = await models.LoginToken.findOne({
      where: { id: (req as any).loginTokenForRedirect },
    });
    tokenObj.social_account = newAccount.id;
    await tokenObj.save();
  }

  if (req.user) {
    await newAccount.setUser(req.user);
    return cb(null, req.user);
  } else {
    const newUser = await models.User.createWithProfile(models, {
      email: null,
    });
    await models.Subscription.create({
      subscriber_id: newUser.id,
      category_id: NotificationCategories.NewMention,
      object_id: `user-${newUser.id}`,
      is_active: true,
    });
    await models.Subscription.create({
      subscriber_id: newUser.id,
      category_id: NotificationCategories.NewCollaboration,
      object_id: `user-${newUser.id}`,
      is_active: true,
    });
    await models.Subscription.create({
      subscriber_id: newUser.id,
      category_id: NotificationCategories.NewChatMention,
      object_id: `user-${newUser.id}`,
      is_active: true,
    });
    await newAccount.setUser(newUser);
    return cb(null, newUser);
  }
}

export function initSocialAccountAuth(models: DB) {
  // allow user to authenticate with Github
  // create stub user without email
  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET && GITHUB_OAUTH_CALLBACK)
    passport.use(
      new GithubStrategy(
        {
          clientID: GITHUB_CLIENT_ID,
          clientSecret: GITHUB_CLIENT_SECRET,
          callbackURL: GITHUB_OAUTH_CALLBACK,
          passReqToCallback: true,
          store: true,
        },
        async (req: Request, accessToken, refreshToken, profile, cb) => {
          await authenticateSocialAccount(
            Providers.GITHUB,
            req,
            accessToken,
            refreshToken,
            profile,
            cb,
            models
          );
        }
      )
    );

  if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET && DISCORD_OAUTH_CALLBACK)
    passport.use(
      new DiscordStrategy(
        {
          clientID: DISCORD_CLIENT_ID,
          clientSecret: DISCORD_CLIENT_SECRET,
          scope: DISCORD_OAUTH_SCOPES,
          passReqToCallback: true,
          authorizationURL:
            'https://discord.com/api/oauth2/authorize?prompt=none',
          callbackURL: DISCORD_OAUTH_CALLBACK,
          store: true,
          // pass in the 'verify' callback
        },
        async (req: Request, accessToken, refreshToken, profile, cb) => {
          await authenticateSocialAccount(
            Providers.DISCORD,
            req,
            accessToken,
            refreshToken,
            profile,
            cb,
            models
          );
        }
      )
    );
}
