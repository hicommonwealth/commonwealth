import passport from 'passport';
import passportGithub from 'passport-github';
import passportDiscord from 'passport-discord';
import { Request } from 'express';
import { Strategy as TwitterStrategy } from 'passport-twitter';

import '../types';
import { DB } from '../database';
import {
  GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_OAUTH_CALLBACK,
  DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_OAUTH_CALLBACK, DISCORD_OAUTH_SCOPES,
  TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_CLIENT_SECRET, TWITTER_OAUTH_CALLBACK
} from '../config';
import { NotificationCategories } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

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
  // const str = '&state='
  // const splitState = req.url.substring(req.url.indexOf(str) + str.length)
  // const state = splitState.substring(splitState.indexOf('='));
  // console.log(`State check: ${state} vs ${req.sessionID}`);
  // if (state !== req.sessionID) return cb(null, false)

  const account = await models.SocialAccount.findOne({
    where: { provider, provider_userid: profile.id }
  });

  // Existing Github account. If there is already a user logged-in,
  // transfer the Github link to the current user.
  if (account !== null) {
    // Handle OAuth for custom domains.
    //
    // If req.query.from is a valid custom domain for a community,
    // associate our LoginToken with this Github account. We will
    // redirect to [customdomain] afterwards and consume this
    // LoginToken to get a new login session.
    if ((req as any).loginTokenForRedirect) {
      const tokenObj = await models.LoginToken.findOne({
        where: {id: (req as any).loginTokenForRedirect}
      });
      tokenObj.social_account = account.id;
      await tokenObj.save();
    }

    // Update profile data on the SocialAccount.
    if (accessToken !== account.access_token
        || refreshToken !== account.refresh_token
        || profile.username !== account.provider_username) {
      account.access_token = accessToken;
      account.refresh_token = refreshToken;
      account.provider_username = profile.username;
      await account.save();
    }

    // Check associations and log in the correct user.
    const user = await account.getUser();
    if (req.user === null && user === null) {
      const newUser = await models.User.createWithProfile(models, { email: null });
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

  // New Github account. Either link it to the existing user, or
  // create a new user. As a result it's possible that we end up
  // with a user with multiple Github accounts linked.
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
      where: {id: (req as any).loginTokenForRedirect}
    });
    tokenObj.social_account = newAccount.id;
    await tokenObj.save();
  }

  if (req.user) {
    await newAccount.setUser(req.user);
    return cb(null, req.user);
  } else {
    const newUser = await models.User.createWithProfile(models, { email: null });
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
    await newAccount.setUser(newUser);
    return cb(null, newUser);
  }
}

export function useSocialAccountAuth(models: DB) {
  // allow user to authenticate with Github
  // create stub user without email
  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET && GITHUB_OAUTH_CALLBACK) passport.use(new GithubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: GITHUB_OAUTH_CALLBACK,
    passReqToCallback: true,
  }, async (req: Request, accessToken, refreshToken, profile, cb) => {
    await authenticateSocialAccount(Providers.GITHUB, req, accessToken, refreshToken, profile, cb, models)
  }));

  if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET && DISCORD_OAUTH_CALLBACK) passport.use(new DiscordStrategy({
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    scope: DISCORD_OAUTH_SCOPES,
    passReqToCallback: true,
    authorizationURL: 'https://discord.com/api/oauth2/authorize?prompt=none',
    callbackURL: DISCORD_OAUTH_CALLBACK
  }, async (req: Request, accessToken, refreshToken, profile, cb) => {
    await authenticateSocialAccount(Providers.DISCORD,  req, accessToken, refreshToken, profile, cb, models)
  }))
}

export function twitterAuth(models) {
  return new TwitterStrategy({
    consumerKey: TWITTER_API_KEY,
    consumerSecret: TWITTER_API_SECRET,
    callbackURL: TWITTER_OAUTH_CALLBACK,
    passReqToCallback: true,
  }, async (req, token, tokenSecret, profile, cb) => {
    const twitterAccount = await models.SocialAccount.findOne({
      where: { provider: 'twitter', provider_userid: profile.id }
    });

    // Existing Twitter account. If there is already a user logged-in,
    // transfer the Twitter link to the current user.
    if (twitterAccount !== null) {
      // Handle OAuth for custom domains.
      //
      // If req.query.from is a valid custom domain for a community,
      // associate our LoginToken with this Twitter account. We will
      // redirect to [customdomain] afterwards and consume this
      // LoginToken to get a new login session.
      if ((req as any).loginTokenForRedirect) {
        const tokenObj = await models.LoginToken.findOne({
          where: { id: (req as any).loginTokenForRedirect }
        });
        tokenObj.social_account = twitterAccount.id;
        await tokenObj.save();
      }

      // Update profile data on the SocialAccount.
      if (token !== twitterAccount.access_token
        || tokenSecret !== twitterAccount.access_token_secret
        || profile.username !== twitterAccount.provider_username) {
        twitterAccount.access_token = token;
        twitterAccount.access_token_secret = tokenSecret;
        twitterAccount.provider_username = profile.username;
        await twitterAccount.save();
      }

      // Check associations and log in the correct user.
      const user = await twitterAccount.getUser();
      if (req.user === null && user === null) {
        const newUser = await models.User.create({ email: null });
        await twitterAccount.setUser(newUser);
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

    // New Twitter account. Either link it to the existing user, or
    // create a new user. As a result it's possible that we end up
    // with a user with multiple Twitter accounts linked.
    const newTwitterAccount = await models.SocialAccount.create({
      provider: 'twitter',
      provider_userid: profile.id,
      provider_username: profile.username,
      access_token: token,
      access_token_secret: tokenSecret,
    });

    // Handle OAuth for custom domains.
    //
    // If req.query.from is a valid custom domain for a community,
    // associate our LoginToken with this Twitter account. We will
    // redirect to [customdomain] afterwards and consume this
    // LoginToken to get a new login session.
    if ((req as any).loginTokenForRedirect) {
      const tokenObj = await models.LoginToken.findOne({
        where: { id: (req as any).loginTokenForRedirect }
      });
      tokenObj.social_account = newTwitterAccount.id;
      await tokenObj.save();
    }

    if (req.user) {
      // @ts-ignore
      await newTwitterAccount.setUser(req.user);
      return cb(null, req.user);
    } else {
      const newUser = await models.User.create({ email: null });
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
      await newTwitterAccount.setUser(newUser);
      return cb(null, newUser);
    }
  })
}