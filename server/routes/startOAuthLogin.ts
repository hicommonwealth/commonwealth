import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';

import { GITHUB_OAUTH_CALLBACK } from '../config';

const startOAuthLogin = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  let successRedirect = '/';
  let failureRedirect = '#!/login';
  if (req.query.from) {
    // Validate that req.query.from matches an existing Chain or Community
    try {
      const [chain, community] = await Promise.all([
        models.Chain.findOne({ where: { customDomain: req.query.from } }),
        models.OffchainCommunity.findOne({ where: { customDomain: req.query.from } }),
      ]);
      if (chain || community) {
        const tokenObj = await models.LoginToken.createForOAuth(<string>req.query.from);
        successRedirect = `https://${req.query.from}/api/finishOAuthLogin?token=${tokenObj.token}`;
        (req as any).loginTokenForRedirect = tokenObj.id;
      }
    } catch (e) { console.log('Error:', e); }
  }

  passport.authenticate('github', {
    callbackURL: `${GITHUB_OAUTH_CALLBACK}?from=${encodeURIComponent(req.hostname)}`,
    successRedirect: successRedirect,
    failureRedirect: failureRedirect,
  } as any)(req, res, next); // TODO: extend AuthenticateOptions typing used here
};

export default startOAuthLogin;
