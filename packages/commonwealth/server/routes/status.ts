import { ServerError } from 'common-common/src/errors';
import type { ChainCategoryType } from 'common-common/src/types';
import jwt from 'jsonwebtoken';
import { Op, QueryTypes } from 'sequelize';
import type { AddressInstance } from 'server/models/address';
import type { NotificationCategoryInstance } from 'server/models/notification_category';
import type { StarredCommunityAttributes } from 'server/models/starred_community';
import type {
  EmailNotificationInterval,
  UserInstance,
} from 'server/models/user';
import { ETH_RPC, JWT_SECRET } from '../config';
import { sequelize } from '../database';
import type { DB } from '../models';
import type { CommunityInstance } from '../models/community';
import { ThreadAttributes } from '../models/thread';
import type { TypedRequestQuery, TypedResponse } from '../types';
import { success } from '../types';
import type { RoleInstanceWithPermission } from '../util/roles';
import { findAllRoles } from '../util/roles';

type ThreadCountQueryData = {
  concat: string;
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
    selectedChain: CommunityInstance;
    isAdmin: boolean;
    disableRichText: boolean;
    starredCommunities: StarredCommunityAttributes[];
    unseenPosts: { [chain: string]: number };
  };
  evmTestEnv?: string;
  enforceSessionKeys?: boolean;
  chainCategoryMap: { [chain: string]: ChainCategoryType[] };
};

const getChainStatus = async (models: DB) => {
  const [chains, notificationCategories] = await Promise.all([
    models.Community.findAll({
      where: { active: true },
    }),
    models.NotificationCategory.findAll(),
  ]);

  const chainCategories: { [chain: string]: ChainCategoryType[] } = {};
  for (const chain of chains) {
    if (chain.category !== null) {
      chainCategories[chain.id] = chain.category as ChainCategoryType[];
    }
  }

  const thirtyDaysAgo = new Date(
    (new Date() as any) - 1000 * 24 * 60 * 60 * 30,
  );

  const threadCountQueryData: ThreadCountQueryData[] =
    await models.sequelize.query(
      `
      SELECT "Threads".chain, COUNT("Threads".id)
      FROM "Threads"
      WHERE "Threads".created_at > :thirtyDaysAgo
      AND "Threads".deleted_at IS NULL
      AND "Threads".chain IS NOT NULL
      GROUP BY "Threads".chain;
      `,
      { replacements: { thirtyDaysAgo }, type: QueryTypes.SELECT },
    );

  return {
    notificationCategories,
    chainCategories,
    threadCountQueryData,
  };
};

export const getUserStatus = async (models: DB, user: UserInstance) => {
  const chains = await models.Community.findAll({
    where: { active: true },
    attributes: ['id'],
  });

  const unfilteredAddresses = await user.getAddresses();
  // TODO: fetch all this data with a single query
  const [addresses, selectedChain, isAdmin, disableRichText] =
    await Promise.all([
      unfilteredAddresses.filter(
        (address) =>
          !!address.verified &&
          chains.map((c) => c.id).includes(address.community_id),
      ),
      user.getSelectedChain(),
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
  const commsAndChains = await getChainActivity(addresses);
  const unseenPosts = {};
  let query = ``;
  let replacements: string[] = [];

  // this loops through the communities/chains for which we want to see if there are any new updates
  // for each community a UNION SELECT query is appended to the query so that that communities updated threads are
  // included in the final result. This method allows us to submit a single query for all the communities rather
  // than a new query for each community
  for (let i = 0; i < commsAndChains.length; i++) {
    const name = commsAndChains[i][0];
    const date = commsAndChains[i][1];

    if (!date) {
      unseenPosts[name] = {};
      continue;
    }

    // adds a union between SELECT queries if the number of SELECT queries is greater than 1
    if (i != 0) query += ' UNION ';
    // add the chain and timestamp to replacements so that we can safely populate the query with dynamic parameters
    replacements.push(name, date);
    // append the SELECT query
    query += `SELECT id, chain FROM "Threads" WHERE
    chain = ? AND created_at > ? AND deleted_at IS NULL`;
    if (i === commsAndChains.length - 1) query += ';';
  }

  // populate the query replacements and execute the query
  const threadNumPromise = sequelize.query<
    Pick<ThreadAttributes, 'id' | 'chain'>
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
    if (!unseenPosts[thread.chain]) unseenPosts[thread.chain] = {};
    unseenPosts[thread.chain].activePosts
      ? unseenPosts[thread.chain].activePosts.add(thread.id)
      : (unseenPosts[thread.chain].activePosts = new Set([thread.id]));
    unseenPosts[thread.chain].threads
      ? unseenPosts[thread.chain].threads++
      : (unseenPosts[thread.chain].threads = 1);
  }

  // reset var
  query = ``;
  replacements = [];

  // same principal as the loop above but for comments instead of threads
  for (let i = 0; i < commsAndChains.length; i++) {
    const name = commsAndChains[i][0];
    const date = commsAndChains[i][1];

    if (!date) {
      unseenPosts[name] = {};
      continue;
    }

    // adds a union between SELECT queries if the number of SELECT queries is greater than 1
    if (i !== 0) query += ' UNION ';
    // add the chain and timestamp to replacements so that we can safely populate the query with dynamic parameters
    replacements.push(name, date);
    // append the SELECT query
    query += `SELECT thread_id, chain FROM "Comments" WHERE chain = ? AND created_at > ?`;
    if (i === commsAndChains.length - 1) query += ';';
  }

  // populate query and execute
  const commentNum: { thread_id: string; chain: string }[] = <any>(
    await sequelize.query(query, {
      raw: true,
      type: QueryTypes.SELECT,
      replacements,
    })
  );

  // iterates through the retrieved comments and adds each thread id to the activePosts set
  for (const comment of commentNum) {
    if (!unseenPosts[comment.chain]) unseenPosts[comment.chain] = {};
    const id = comment.thread_id;
    unseenPosts[comment.chain].activePosts
      ? unseenPosts[comment.chain].activePosts.add(id)
      : (unseenPosts[comment.chain].activePosts = new Set(id));
    unseenPosts[comment.chain].comments
      ? unseenPosts[comment.chain].comments++
      : (unseenPosts[comment.chain].comments = 1);
  }

  // set the activePosts to num in set
  for (const chain of commsAndChains) {
    const [name, date] = chain;
    if (!date) {
      unseenPosts[name] = {};
      continue;
    }
    // if the time is valid but the chain is not defined in the unseenPosts object
    // then initialize the object with zeros
    if (!unseenPosts[name]) {
      unseenPosts[name] = {
        activePosts: 0,
        threads: 0,
        comments: 0,
      };
    } else {
      // if the chain does have activePosts convert the set of ids to simply the length of the set
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
      selectedChain,
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
    const chainStatusPromise = getChainStatus(models);
    const { user: reqUser } = req;
    if (!reqUser) {
      const { notificationCategories, chainCategories, threadCountQueryData } =
        await chainStatusPromise;

      return success(res, {
        notificationCategories,
        recentThreads: threadCountQueryData,
        evmTestEnv: ETH_RPC,
        enforceSessionKeys: process.env.ENFORCE_SESSION_KEYS == 'true',
        chainCategoryMap: chainCategories,
      });
    } else {
      // user is logged in
      const userStatusPromise = getUserStatus(models, reqUser);
      const [chainStatus, userStatus] = await Promise.all([
        chainStatusPromise,
        userStatusPromise,
      ]);
      const { notificationCategories, chainCategories, threadCountQueryData } =
        chainStatus;
      const { roles, user, id, email } = userStatus;
      const jwtToken = jwt.sign({ id, email }, JWT_SECRET);
      user.jwt = jwtToken as string;

      return success(res, {
        notificationCategories,
        recentThreads: threadCountQueryData,
        roles,
        loggedIn: true,
        user,
        evmTestEnv: ETH_RPC,
        enforceSessionKeys: process.env.ENFORCE_SESSION_KEYS == 'true',
        chainCategoryMap: chainCategories,
      });
    }
  } catch (error) {
    console.log(error);
    throw new ServerError('something broke', error);
  }
};

type ChainActivity = [chain: string, timestamp: string | null][];

function getChainActivity(
  addresses: AddressInstance[],
): Promise<ChainActivity> {
  return Promise.all(
    addresses.map(async (address) => {
      const { community_id, last_active } = address;
      return [community_id, last_active?.toISOString()];
    }),
  );
}
