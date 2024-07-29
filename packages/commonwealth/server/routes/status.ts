import { ServerError } from '@hicommonwealth/core';
import type {
  AddressInstance,
  CommunityInstance,
  DB,
  EmailNotificationInterval,
  StarredCommunityAttributes,
  UserInstance,
} from '@hicommonwealth/model';
import { sequelize } from '@hicommonwealth/model';
import { CommunityCategoryType } from '@hicommonwealth/shared';
import { Knock } from '@knocklabs/node';
import jwt from 'jsonwebtoken';
import { QueryTypes } from 'sequelize';
import { config } from '../config';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';

type ThreadCountQueryData = {
  communityId: string;
  count: number;
};

type StatusResp = {
  recentThreads: ThreadCountQueryData[];
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
    joinedCommunityIdsWithNewContent: string[]; // ids of communities
  };
  evmTestEnv?: string;
  enforceSessionKeys?: boolean;
  communityCategoryMap: { [communityId: string]: CommunityCategoryType[] };
};

const getCommunityStatus = async (models: DB) => {
  const communities = await models.Community.findAll({
    where: { active: true },
  });

  const communityCategories: {
    [communityId: string]: CommunityCategoryType[];
  } = {};
  for (const community of communities) {
    if (community.category !== null) {
      // @ts-expect-error StrictNullChecks
      communityCategories[community.id] =
        community.category as CommunityCategoryType[];
    }
  }

  const thirtyDaysAgo = new Date(
    (new Date() as any) - 1000 * 24 * 60 * 60 * 30,
  );

  const threadCountQueryData: ThreadCountQueryData[] =
    await models.sequelize.query<{ communityId: string; count: number }>(
      `
          SELECT "Threads".community_id as "communityId", COUNT("Threads".id)
          FROM "Threads"
          WHERE "Threads".created_at > :thirtyDaysAgo
            AND "Threads".deleted_at IS NULL
          GROUP BY "Threads".community_id;
      `,
      { replacements: { thirtyDaysAgo }, type: QueryTypes.SELECT },
    );

  return {
    communityCategories,
    threadCountQueryData,
  };
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

  // get ids of user-joined coommunities which have new content after user's last_active date per addresses
  const joinedCommunityIdsWithNewContent: string[] = [];
  for (let i = 0; i < addresses.length; i++) {
    const { community_id, last_active } = addresses[i];

    // continue to next address
    if (
      !community_id ||
      !last_active ||
      joinedCommunityIdsWithNewContent.includes(community_id)
    ) {
      continue;
    }

    const query = `
        SELECT (
          (
            SELECT COUNT(*) 
              FROM "Threads" 
              WHERE "community_id" = :community_id 
              AND "created_at" > :last_active 
              AND "deleted_at" IS NULL
          )
          +
          (
            SELECT COUNT(*) 
            FROM "Comments" 
            WHERE "community_id" = :community_id 
            AND "created_at" > :last_active 
            AND "deleted_at" IS NULL
          )
        ) AS count;
      `;
    const response = await sequelize.query<{ count: string }>(query, {
      raw: true,
      type: QueryTypes.SELECT,
      replacements: { community_id, last_active: last_active?.toISOString() },
    });
    const count = parseInt(response[0].count); // query returns `count` as a string, convert it to int

    if (count > 0) joinedCommunityIdsWithNewContent.push(community_id);
  }

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
      joinedCommunityIdsWithNewContent,
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
    const communityStatusPromise = getCommunityStatus(models);
    const { user: reqUser } = req;
    if (!reqUser) {
      const { communityCategories, threadCountQueryData } =
        await communityStatusPromise;

      return success(res, {
        recentThreads: threadCountQueryData,
        evmTestEnv: config.EVM.ETH_RPC,
        enforceSessionKeys: config.ENFORCE_SESSION_KEYS,
        communityCategoryMap: communityCategories,
      });
    } else {
      // user is logged in
      const userStatusPromise = getUserStatus(models, reqUser);
      const [communityStatus, userStatus] = await Promise.all([
        communityStatusPromise,
        userStatusPromise,
      ]);
      const { communityCategories, threadCountQueryData } = communityStatus;
      const { user, id } = userStatus;

      const jwtToken = jwt.sign({ id }, config.AUTH.JWT_SECRET, {
        expiresIn: config.AUTH.SESSION_EXPIRY_MILLIS / 1000,
      });

      // @ts-expect-error StrictNullChecks
      const knockJwtToken = await computeKnockJwtToken(user.id);

      user.jwt = jwtToken as string;
      user.knockJwtToken = knockJwtToken!;

      return success(res, {
        recentThreads: threadCountQueryData,
        loggedIn: true,
        // @ts-expect-error StrictNullChecks
        user,
        evmTestEnv: config.EVM.ETH_RPC,
        enforceSessionKeys: config.ENFORCE_SESSION_KEYS,
        communityCategoryMap: communityCategories,
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
