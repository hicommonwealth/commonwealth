import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../database';
import { TypedRequestQuery, TypedResponse, success } from '../types';
import { AppError } from '../util/errors';
import { decryptWithJWE, encryptWithJWE } from '../util/jwe';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  // TODO: populate & write unit tests
};

type AuthCallbackReq = { token: string /* , profile_id: number */ };
type AuthCallbackResp = string;

const TOKEN_EXPIRATION = 5 * 60 * 1000; // 5 minutes

const authCallback = async (
  models: DB,
  req: TypedRequestQuery<AuthCallbackReq>,
  res: TypedResponse<AuthCallbackResp>
) => {
  // 1. fetch addresses associated with selected profile
  if (!req.user?.id) {
    throw new AppError('User must be logged in');
  }
  if (!req.query || !req.query.token) {
    throw new AppError('Invalid querystring');
  }

  // TODO: selectable profile -- currently user only has one
  const profile = await models.Profile.findOne({
    where: {
      // id: req.query.profile_id,
      user_id: req.user.id,
    }
  })
  if (!profile) {
    throw new AppError('Profile does not exist');
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
    throw new AppError('Could not decrypt token');
  }

  // 3. persist token & reject if replay or if expired
  // TODO: persist stateToken with profile / handle replays
  if (Date.now() > (iat + TOKEN_EXPIRATION)) {
    log.info(`Token issued at ${iat} expired.`);
    throw new AppError('Registration error, please try again.');
  }

  // 4. construct object containing CB data
  // TODO: filter addresses by base/chain/etc
  const allAddresses = await models.Address.findAll({
    where: {
      profile_id: profile.id,
    }
  });

  const responseObject = {
    // TODO: filter duplicates
    addresses: allAddresses.map((a) => a.address),
    // TODO: pass profile id?
    stateToken,
  };

  // 5. encrypt response object & respond
  const encryptedResponse = await encryptWithJWE(responseObject);

  // TODO: should we redirect here, or on client?
  return success(res, encryptedResponse);
};

export default authCallback;
