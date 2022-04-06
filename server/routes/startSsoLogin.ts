import uuidv4 from 'uuid/v4';

import { TypedRequestBody, TypedResponse, success } from '../types';
import { AppError, ServerError } from '../util/errors';
import { Issuers } from './finishSsoLogin';
import { DB } from '../database';
import { AXIE_SHARED_SECRET } from '../config';

const Errors = {
  InvalidIssuer: 'Invalid issuer',
  NoSharedSecret: 'No shared secret',
};

type StartSsoLoginReq = { issuer: Issuers };
type StartSsoLoginRes = { stateId: string };

const startSsoLogin = async (
  models: DB,
  req: TypedRequestBody<StartSsoLoginReq>,
  res: TypedResponse<StartSsoLoginRes>
) => {
  if (req.body.issuer === Issuers.AxieInfinity) {
    if (!AXIE_SHARED_SECRET) {
      throw new ServerError(Errors.NoSharedSecret);
    }
    const stateId: string = uuidv4();
    await models.SsoToken.create({
      state_id: stateId,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return success(res, { stateId });
  } else {
    throw new AppError(Errors.InvalidIssuer);
  }
};

export default startSsoLogin;
