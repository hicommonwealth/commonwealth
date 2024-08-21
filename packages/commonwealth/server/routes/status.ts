import { ServerError } from '@hicommonwealth/core';
import type {
  AddressInstance,
  CommunityInstance,
  DB,
  EmailNotificationInterval,
  StarredCommunityAttributes,
  UserInstance,
} from '@hicommonwealth/model';
import { Knock } from '@knocklabs/node';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';

type StatusResp = {
  loggedIn?: boolean;
  user?: {
    id: number;
    email: string;
    emailVerified: boolean;
    emailInterval: EmailNotificationInterval;
    jwt: string;
    knockJwtToken: string;
    addresses: AddressInstance[];
    selectedCommunity: CommunityInstance;
    isAdmin: boolean;
    disableRichText: boolean;
    starredCommunities: StarredCommunityAttributes[];
  };
  evmTestEnv?: string;
  enforceSessionKeys?: boolean;
};

export const getUserStatus = async (models: DB, user: UserInstance) => {
  const communities = await models.Community.findAll({
    where: { active: true },
    attributes: ['id'],
  });

  const unfilteredAddresses = await user.getAddresses();
  // TODO: fetch all this data with a single query
  const [addresses, selectedCommunity, isAdmin, disableRichText] =
    await Promise.all([
      unfilteredAddresses.filter(
        (address) =>
          !!address.verified &&
          communities.map((c) => c.id).includes(address.community_id),
      ),
      user.getSelectedCommunity(),
      user.isAdmin,
      user.disableRichText,
    ]);

  // get starred communities for user
  const starredCommunities = await models.StarredCommunity.findAll({
    where: { user_id: user.id },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      emailInterval: user.emailNotificationInterval,
      promotional_emails_enabled: user.promotional_emails_enabled,
      is_welcome_onboard_flow_complete: user.is_welcome_onboard_flow_complete,
      jwt: '',
      knockJwtToken: '',
      addresses,
      selectedCommunity,
      isAdmin,
      disableRichText,
      starredCommunities,
    },
    id: user.id,
    email: user.email,
  };
};

export const status = async (
  models: DB,
  req: TypedRequestQuery,
  res: TypedResponse<StatusResp>,
) => {
  try {
    const { user: reqUser } = req;
    if (!reqUser) {
      return success(res, {
        evmTestEnv: config.EVM.ETH_RPC,
        enforceSessionKeys: config.ENFORCE_SESSION_KEYS,
      });
    } else {
      // user is logged in
      const userStatus = await getUserStatus(models, reqUser);
      const { user, id } = userStatus;

      const jwtToken = jwt.sign({ id }, config.AUTH.JWT_SECRET, {
        expiresIn: config.AUTH.SESSION_EXPIRY_MILLIS / 1000,
      });

      const knockJwtToken = await computeKnockJwtToken(user.id);

      user.jwt = jwtToken as string;
      user.knockJwtToken = knockJwtToken!;

      return success(res, {
        loggedIn: true,

        user,
        evmTestEnv: config.EVM.ETH_RPC,
        enforceSessionKeys: config.ENFORCE_SESSION_KEYS,
      });
    }
  } catch (error) {
    console.log(error);
    throw new ServerError('something broke', error);
  }
};

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
