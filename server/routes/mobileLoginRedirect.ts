import { NextFunction, Request, Response } from 'express';
import { Magic } from '@magic-sdk/admin';
import { MagicUser } from 'passport-magic';
import jwt from 'jsonwebtoken';

import { MAGIC_DEFAULT_CHAIN, JWT_SECRET } from '../config';
import { authenticateMagicLink } from '../util/magicLink';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

/**
 * Used as the redirect endpoint from a user's magic.link email on a mobile device.
 * Should register the user, generate a jwt, and redirect them to the deeplink URL
 * with appropriate arguments set.
 */
const mobileLoginRedirect = async (models, magic: Magic, req: Request, res: Response, next: NextFunction) => {
  if (!magic) {
    return next(new Error('Magic support not enabled.'));
  }
  const { didToken, redirectDeeplink } = req.query;
  if (!didToken) {
    return next(new Error('Must provide DID token'));
  }
  if (!redirectDeeplink) {
    return next(new Error('Must provide redirectDeeplink'));
  }

  // parse user from DID
  let magicUser: MagicUser;
  try {
    magic.token.validate(didToken);
    magicUser = {
      issuer: magic.token.getIssuer(didToken),
      publicAddress: magic.token.getPublicAddress(didToken),
      claim: magic.token.decode(didToken)[1],
    };
  } catch (err) {
    return next(new Error('Could not validate DID token.'));
  }

  // fetch default chain (TODO: provide option to pass in chain)
  const chain = await models.Chain.findOne({ where: { id: MAGIC_DEFAULT_CHAIN } });

  // perform login (TODO: support additional roles)
  const result = await authenticateMagicLink(models, magic, magicUser, chain);
  if (result.error) {
    return next(new Error(result.error));
  }
  if (!result.user) {
    return next(new Error(result.message || 'Could not authenticate user.'));
  }
  const { user, isSignup } = result;
  const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

  // TODO: validate deep link
  const redirectUrl = `${
    decodeURIComponent(redirectDeeplink)
  }?screen=Validate&jwt=${jwtToken}&mode=${isSignup ? 'signup' : 'login'}`;
  return res.json({ status: 'Success', result: { redirectUrl } });
};

export default mobileLoginRedirect;
