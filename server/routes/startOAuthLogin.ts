import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';

import {DISCORD_OAUTH_CALLBACK, GITHUB_OAUTH_CALLBACK} from '../config';

interface AuthOptions extends passport.AuthenticateOptions {
  callbackURL: string
}

const startOAuthLogin = async (
  models: DB,
  provider: string,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("Discord logging in");
  let successRedirect = '/';
  const failureRedirect = '#!/login';
  if (req.query.from) {
    // Validate that req.query.from matches an existing Chain
    try {
      const chain = await models.Chain.findOne({ where: { custom_domain: req.query.from } });
      if (chain) {
        const tokenObj = await models.LoginToken.createForOAuth(req.query.from);
        successRedirect = `https://${req.query.from}/api/finishOAuthLogin?token=${tokenObj.token}`;
        (req as any).loginTokenForRedirect = tokenObj.id;
      }
    } catch (e) {
      console.log('Error:', e);
    }
  }

  if (provider === 'github') {
    passport.authenticate('github', {
      callbackURL: `${GITHUB_OAUTH_CALLBACK}?from=${encodeURIComponent(
        req.hostname
      )}`,
      successRedirect,
      failureRedirect,
    } as AuthOptions)(req, res, next);
  }
  else {
    // TODO: figure out how to pass a callbackURL without error
    console.log(`Authenticating with discord.`)
    passport.authenticate('discord', {
      successRedirect,
      failureRedirect,
    })(req, res, next)
  }
};

export default startOAuthLogin;
