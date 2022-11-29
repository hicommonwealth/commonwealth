import { Request, Response, NextFunction } from 'express';
import { DB } from '../models';

interface AuthInfoExtended extends Express.AuthInfo {
  state?: {
    hostname: string
  }
}

const startOAuthLogin = async (
  models: DB,
  provider: string,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("Auth info startOAuthLogin:", req.authInfo);
  let successRedirect = '/';

  // custom domain OAuth2.0 login logic. OAuth2.0 login is currently disabled for custom domains.
  // const hostname = (<AuthInfoExtended>req.authInfo)?.state?.hostname
  // if (hostname && hostname !== 'localhost') {
  //   // Validate that req.query.from matches an existing Chain
  //   try {
  //     const chain = await models.Chain.findOne({ where: { custom_domain: hostname } });
  //     if (chain) {
  //       const tokenObj = await models.LoginToken.createForOAuth(hostname);
  //       successRedirect = `https://${hostname}/api/finishOAuthLogin?token=${tokenObj.token}`;
  //       (req as any).loginTokenForRedirect = tokenObj.id;
  //     }
  //   } catch (e) {
  //     console.log('Error:', e);
  //   }
  // }

  res.redirect(successRedirect);
};

export default startOAuthLogin;
