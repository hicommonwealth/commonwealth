import { ServerError } from '@hicommonwealth/core';
import {
  sequelize,
  type AddressInstance,
  type CommunityInstance,
  type DB,
  type EmailNotificationInterval,
  type UserInstance,
} from '@hicommonwealth/model';
import { Knock } from '@knocklabs/node';
import jwt from 'jsonwebtoken';
import { QueryTypes } from 'sequelize';
import { config } from '../config';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';

type CommunityWithRedirects = { id: string; redirect: string };

type StarredCommunityResponse = {
  id: number;
  icon_url?: string;
  name: string;
  isStarred: boolean;
};

type StatusResp = {
  loggedIn?: boolean;
  user?: {
    id: number;
    email?: string | null;
    emailVerified?: boolean | null;
    emailInterval?: EmailNotificationInterval;
    jwt: string;
    knockJwtToken: string;
    addresses: AddressInstance[];
    selectedCommunity: CommunityInstance;
    isAdmin: boolean;
    disableRichText?: boolean;
    communities: StarredCommunityResponse[];
  };
  communityWithRedirects?: CommunityWithRedirects[];
  evmTestEnv?: string;
};

export const getUserStatus = async (models: DB, user: UserInstance) => {
  const communities = await models.Community.findAll({
    where: { active: true },
    attributes: ['id'],
  });

  const unfilteredAddresses = await user.getAddresses({
    include: [
      {
        model: models.Community,
        attributes: ['id', 'base', 'ss58_prefix'],
      },
    ],
  });
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
  const userCommunities = await sequelize.query<StarredCommunityResponse>(
    `
      SELECT
        id,
        icon_url,
        name,
        CASE
          WHEN sc.community_id IS NOT NULL THEN TRUE
          ELSE FALSE
        END AS is_starred
      FROM
        "Communities" c
      LEFT JOIN
        "StarredCommunities" sc
      ON
        c.id = sc.community_id
        AND sc.user_id = :user_id
      WHERE
        id IN (
          SELECT
            a.community_id
          FROM
            "Addresses" a
          WHERE
            a.verified IS NOT NULL
            AND a.last_active IS NOT NULL
            AND a.user_id = :user_id
          GROUP BY
            a.community_id
        );
    `,
    {
      replacements: {
        user_id: user.id,
      },
      type: QueryTypes.SELECT,
    },
  );

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
      communities: userCommunities || [],
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
        evmTestEnv: config.TEST_EVM.ETH_RPC,
      });
    } else {
      // user is logged in
      const userStatus = await getUserStatus(models, reqUser);
      const { user, id } = userStatus;

      const jwtToken = jwt.sign({ id }, config.AUTH.JWT_SECRET, {
        expiresIn: config.AUTH.SESSION_EXPIRY_MILLIS / 1000,
      });

      // @ts-expect-error StrictNullChecks
      const knockJwtToken = await computeKnockJwtToken(user.id);

      user.jwt = jwtToken as string;
      user.knockJwtToken = knockJwtToken!;

      // get communities with redirects (this should be a very small list and should'n cause performance issues)
      const communityWithRedirects =
        await models.sequelize.query<CommunityWithRedirects>(
          `SELECT id, redirect FROM "Communities" WHERE redirect IS NOT NULL;`,
          {
            type: QueryTypes.SELECT,
          },
        );

      return success(res, {
        loggedIn: true,
        user: {
          ...user,
          id: user.id!,
          isAdmin: user.isAdmin ?? false,
        },
        communityWithRedirects: communityWithRedirects || [],
        evmTestEnv: config.TEST_EVM.ETH_RPC,
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
