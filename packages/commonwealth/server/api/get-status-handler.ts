import { query, ServerError } from '@hicommonwealth/core';
import { User } from '@hicommonwealth/model';
import { Knock } from '@knocklabs/node';
import jwt from 'jsonwebtoken';
import { success } from 'server/types';
import { config } from '../config';

/**
 * We have to generate a JWT token for use by the frontend Knock SDK.
 */
async function computeKnockJwtToken(userId: number) {
  if (config.NOTIFICATIONS.FLAG_KNOCK_INTEGRATION_ENABLED) {
    return await Knock.signUserToken(`${userId}`, {
      signingKey: config.NOTIFICATIONS.KNOCK_SIGNING_KEY,
      expiresInSeconds: config.AUTH.SESSION_EXPIRY_MILLIS / 1000,
    });
  }
}

export const get_status_handler = async (req, res) => {
  try {
    const { user: reqUser } = req;
    if (!reqUser) {
      return success(res, { evmTestEnv: config.TEST_EVM.ETH_RPC });
    } else {
      // user is logged in
      const status = await query(User.GetStatus(), {
        actor: { user: { id: reqUser.id, email: '' } },
        payload: {},
      });
      const jwtToken = jwt.sign({ id: status!.id }, config.AUTH.JWT_SECRET, {
        expiresIn: config.AUTH.SESSION_EXPIRY_MILLIS / 1000,
      });
      const knockJwtToken = await computeKnockJwtToken(status!.id);

      const user = {
        ...status,
        jwt: jwtToken,
        knockJwtToken: knockJwtToken!,
      };
      return success(res, {
        user,
        communityWithRedirects: (user!.communities || []).filter(
          (c) => c.redirect,
        ),
        evmTestEnv: config.TEST_EVM.ETH_RPC,
      });
    }
  } catch (error) {
    console.log(error);
    throw new ServerError('something broke', error);
  }
};
