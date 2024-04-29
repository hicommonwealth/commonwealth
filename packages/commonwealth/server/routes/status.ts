import { ServerError } from '@hicommonwealth/core';
import type {
  AddressInstance,
  CommunityInstance,
  DB,
  EmailNotificationInterval,
  NotificationCategoryInstance,
  StarredCommunityAttributes,
  UserInstance,
} from '@hicommonwealth/model';
import { ThreadAttributes, sequelize } from '@hicommonwealth/model';
import { CommunityCategoryType } from '@hicommonwealth/shared';
import jwt from 'jsonwebtoken';
import { Op, QueryTypes } from 'sequelize';
import { ETH_RPC, JWT_SECRET } from '../config';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';
import type { RoleInstanceWithPermission } from '../util/roles';
import { findAllRoles } from '../util/roles';

type ThreadCountQueryData = {
  communityId: string;
  count: number;
};

type StatusResp = {
  notificationCategories: NotificationCategoryInstance[];
  recentThreads: ThreadCountQueryData[];
  roles?: RoleInstanceWithPermission[];
  loggedIn?: boolean;
  user?: {
    email: string;
    emailVerified: boolean;
    emailInterval: EmailNotificationInterval;
    jwt: string;
    addresses: AddressInstance[];
    selectedCommunity: CommunityInstance;
    isAdmin: boolean;
    disableRichText: boolean;
    starredCommunities: StarredCommunityAttributes[];
    unseenPosts: { [communityId: string]: number };
    profileId?: number;
  };
  evmTestEnv?: string;
  enforceSessionKeys?: boolean;
  communityCategoryMap: { [communityId: string]: CommunityCategoryType[] };
};

const getCommunityStatus = async (models: DB) => {
  const [communities, notificationCategories] = await Promise.all([
    models.Community.findAll({
      where: { active: true },
    }),
    models.NotificationCategory.findAll(),
  ]);

  const communityCategories: {
    [communityId: string]: CommunityCategoryType[];
  } = {};
  for (const community of communities) {
    if (community.category !== null) {
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
    notificationCategories,
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

  // look up my roles & private communities
  const myAddressIds: number[] = Array.from(
    addresses.map((address) => address.id),
  );

  const roles = await findAllRoles(models, {
    where: { address_id: { [Op.in]: myAddressIds } },
    include: [models.Address],
  });

  // get starred communities for user
  const starredCommunitiesPromise = models.StarredCommunity.findAll({
    where: { user_id: user.id },
  });

  // TODO: Remove or guard JSON.parse calls since these could break the route if there was an error
  /**
   * Purpose of this section is to count the number of threads that have new updates grouped by community
   */
  const communityActivity = await getCommunityActivity(addresses);
  const unseenPosts = {};
  let query = ``;
  let replacements: string[] = [];

  // this loops through the communities for which we want to see if there are any new updates
  // for each community a UNION SELECT query is appended to the query so that that communities updated threads are
  // included in the final result. This method allows us to submit a single query for all the communities rather
  // than a new query for each community
  for (let i = 0; i < communityActivity.length; i++) {
    const name = communityActivity[i][0];
    const date = communityActivity[i][1];

    if (!date) {
      unseenPosts[name] = {};
      continue;
    }

    // adds a union between SELECT queries if the number of SELECT queries is greater than 1
    if (query !== '') query += ' UNION ';
    // add the community and timestamp to replacements so that we can safely populate the query with dynamic parameters
    replacements.push(name, date);
    // append the SELECT query
    query += `SELECT id, community_id
              FROM "Threads"
              WHERE community_id = ?
                AND created_at > ?
                AND deleted_at IS NULL`;
    if (i === communityActivity.length - 1) query += ';';
  }

  // populate the query replacements and execute the query
  const threadNumPromise = sequelize.query<
    Pick<ThreadAttributes, 'id' | 'community_id'>
  >(query, {
    raw: true,
    type: QueryTypes.SELECT,
    replacements,
  });

  // wait for all the promises to resolve
  const [starredCommunities, threadNum] = await Promise.all([
    starredCommunitiesPromise,
    threadNumPromise,
  ]);

  // this section iterates through the retrieved threads
  // counting the number of threads and keeping a set of activePosts
  // the set of activePosts is used to compare with the comments
  // under threads so that there are no duplicate active threads counted
  for (const thread of threadNum) {
    if (!unseenPosts[thread.community_id])
      unseenPosts[thread.community_id] = {};
    unseenPosts[thread.community_id].activePosts
      ? unseenPosts[thread.community_id].activePosts.add(thread.id)
      : (unseenPosts[thread.community_id].activePosts = new Set([thread.id]));
    unseenPosts[thread.community_id].threads
      ? unseenPosts[thread.community_id].threads++
      : (unseenPosts[thread.community_id].threads = 1);
  }

  // reset var
  query = ``;
  replacements = [];

  // same principal as the loop above but for comments instead of threads
  for (let i = 0; i < communityActivity.length; i++) {
    const name = communityActivity[i][0];
    const date = communityActivity[i][1];

    if (!date) {
      unseenPosts[name] = {};
      continue;
    }

    // adds a union between SELECT queries if the number of SELECT queries is greater than 1
    if (query !== '') query += ' UNION ';
    // add the community and timestamp to replacements so that we can safely populate the query with dynamic parameters
    replacements.push(name, date);
    // append the SELECT query
    query += `SELECT thread_id, community_id
              FROM "Comments"
              WHERE community_id = ?
                AND created_at > ?`;
    if (i === communityActivity.length - 1) query += ';';
  }

  // populate query and execute
  const commentNum: { thread_id: string; community_id: string }[] = <any>(
    await sequelize.query(query, {
      raw: true,
      type: QueryTypes.SELECT,
      replacements,
    })
  );

  // iterates through the retrieved comments and adds each thread id to the activePosts set
  for (const comment of commentNum) {
    if (!unseenPosts[comment.community_id])
      unseenPosts[comment.community_id] = {};
    const id = comment.thread_id;
    unseenPosts[comment.community_id].activePosts
      ? unseenPosts[comment.community_id].activePosts.add(id)
      : (unseenPosts[comment.community_id].activePosts = new Set([id]));
    unseenPosts[comment.community_id].comments
      ? unseenPosts[comment.community_id].comments++
      : (unseenPosts[comment.community_id].comments = 1);
  }

  // set the activePosts to num in set
  for (const community of communityActivity) {
    const [name, date] = community;
    if (!date) {
      unseenPosts[name] = {};
      continue;
    }
    // if the time is valid but the community is not defined in the unseenPosts object
    // then initialize the object with zeros
    if (!unseenPosts[name]) {
      unseenPosts[name] = {
        activePosts: 0,
        threads: 0,
        comments: 0,
      };
    } else {
      // if the community does have activePosts convert the set of ids to simply the length of the set
      unseenPosts[name].activePosts = unseenPosts[name].activePosts?.size || 0;
    }
  }
  /**
   * Example Result:
   * {
   *     ethereum: {
   *         activePosts: 10,
   *         threads: 8,
   *         comments: 2
   *     },
   *     aave: {
   *         ...
   *     }
   * }
   */

  return {
    roles,
    user: {
      email: user.email,
      emailVerified: user.emailVerified,
      emailInterval: user.emailNotificationInterval,
      jwt: '',
      addresses,
      selectedCommunity,
      isAdmin,
      disableRichText,
      starredCommunities,
      unseenPosts,
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
      const {
        notificationCategories,
        communityCategories,
        threadCountQueryData,
      } = await communityStatusPromise;

      return success(res, {
        notificationCategories,
        recentThreads: threadCountQueryData,
        evmTestEnv: ETH_RPC,
        enforceSessionKeys: process.env.ENFORCE_SESSION_KEYS == 'true',
        communityCategoryMap: communityCategories,
      });
    } else {
      // user is logged in
      const userStatusPromise = getUserStatus(models, reqUser);
      const profilePromise = models.Profile.findOne({
        where: {
          user_id: reqUser.id,
        },
      });
      const [communityStatus, userStatus, profileInstance] = await Promise.all([
        communityStatusPromise,
        userStatusPromise,
        profilePromise,
      ]);
      const {
        notificationCategories,
        communityCategories,
        threadCountQueryData,
      } = communityStatus;
      const { roles, user, id, email } = userStatus;
      const jwtToken = jwt.sign({ id, email }, JWT_SECRET);
      user.jwt = jwtToken as string;

      return success(res, {
        notificationCategories,
        recentThreads: threadCountQueryData,
        roles,
        loggedIn: true,
        user: { ...user, profileId: profileInstance.id },
        evmTestEnv: ETH_RPC,
        enforceSessionKeys: process.env.ENFORCE_SESSION_KEYS == 'true',
        communityCategoryMap: communityCategories,
      });
    }
  } catch (error) {
    console.log(error);
    throw new ServerError('something broke', error);
  }
};

type CommunityActivity = [communityId: string, timestamp: string | null][];

function getCommunityActivity(
  addresses: AddressInstance[],
): Promise<CommunityActivity> {
  return Promise.all(
    addresses.map(async (address) => {
      const { community_id, last_active } = address;
      return [community_id, last_active?.toISOString()];
    }),
  );
}
