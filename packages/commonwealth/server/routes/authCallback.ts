import {
  AppError,
  ServerError,
  formatFilename,
  loggerFactory,
} from '@hicommonwealth/adapters';
import { DISCORD_BOT_SUCCESS_URL } from '../config';
import type { DB } from '../models';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';
import { decryptWithJWE, encryptWithJWE } from '../util/jwe';

const log = loggerFactory.getLogger(formatFilename(__filename));

export const Errors = {
  // TODO: write unit tests
  RegistrationError: 'Registration error, please try again.',
};

type AuthCallbackReq = { token: string };
type AuthCallbackResp = string;

const TOKEN_EXPIRATION = 5 * 60 * 1000; // 5 minutes

const authCallback = async (
  models: DB,
  req: TypedRequestQuery<AuthCallbackReq>,
  res: TypedResponse<AuthCallbackResp>,
) => {
  // 1. fetch addresses associated with selected profile
  if (!req.user?.id) {
    throw new AppError('User must be signed in');
  }
  if (!req.query || !req.query.token) {
    throw new AppError('Invalid querystring');
  }

  // TODO: selectable profile -- currently user only has one
  const profile = await models.Profile.findOne({
    where: {
      // id: req.query.profile_id,
      user_id: req.user.id,
    },
  });
  if (!profile) {
    throw new ServerError('User profile should exist but missing');
  }

  // 2. decode request
  let stateToken: string;
  let iat: number;
  try {
    const decryptedToken = await decryptWithJWE(req.query.token);
    const tokenObj = JSON.parse(decryptedToken);
    stateToken = tokenObj.token;
    iat = +tokenObj.iat;
  } catch (err) {
    log.info(`Failed to decrypt JWE: ${err.message}`);
    throw new AppError(Errors.RegistrationError);
  }

  // 3. persist token & reject if replay or if expired
  if (Date.now() > iat + TOKEN_EXPIRATION) {
    log.info(`Token issued at ${iat} expired.`);
    throw new AppError(Errors.RegistrationError);
  }
  const [ssoToken, created] = await models.SsoToken.findOrCreate({
    where: {
      state_id: stateToken,
    },
    defaults: {
      profile_id: profile.id,
      issued_at: Math.floor(iat / 1000), // convert to seconds
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  if (!created) {
    log.warn(`Replay attack detected for SsoToken id ${ssoToken.id}!`);
    throw new AppError(Errors.RegistrationError);
  }

  // 4. construct object containing CB data
  // TODO: filter addresses by base/chain/etc, if provided by CMN Bot
  const allAddresses = await models.Address.findAll({
    where: {
      profile_id: profile.id,
    },
  });

  const responseObject = {
    // TODO: filter duplicates
    addresses: allAddresses.map((a) => a.address),
    profileId: profile.id,
    stateToken,
  };

  // 5. encrypt response object & respond
  const encryptedResponse = await encryptWithJWE(responseObject);

  // construct callback URL for reply
  const redirectURL = `${DISCORD_BOT_SUCCESS_URL}/success/${encryptedResponse}`;

  // redirect once response received on client
  return success(res, redirectURL);
};

export default authCallback;
