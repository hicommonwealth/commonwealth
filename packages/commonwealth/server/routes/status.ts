import { QueryTypes, Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET } from '../config';
import { factory, formatFilename } from 'common-common/src/logging';
import '../types';
import {DB, sequelize} from '../database';
import { ServerError } from '../util/errors';

const log = factory.getLogger(formatFilename(__filename));

const status = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      chains,
      nodes,
      contractCategories,
      notificationCategories,
      chainCategories,
      chainCategoryTypes,
    ] = await Promise.all([
      models.Chain.findAll({
        where: { active: true },
        include: [
          {
            model: models.Topic,
            as: 'topics',
          },
          {
            model: models.ChainNode,
          }
        ],
      }),
      models.ChainNode.findAll(),
      models.ContractCategory.findAll(),
      models.NotificationCategory.findAll(),
      models.ChainCategory.findAll(),
      models.ChainCategoryType.findAll(),
    ]);

    const thirtyDaysAgo = new Date(
      (new Date() as any) - 1000 * 24 * 60 * 60 * 30
    );
    const { user } = req;
    type ThreadCountQueryData = {
      concat: string;
      count: number;
    };

    if (!user) {
      const threadCountQueryData: ThreadCountQueryData[] =
        await models.sequelize.query(
          `
        SELECT "Threads".chain, COUNT("Threads".id) 
        FROM "Threads"
        WHERE "Threads".deleted_at IS NULL
        AND NOT "Threads".pinned
        AND "Threads".chain IS NOT NULL
        GROUP BY "Threads".chain;
        `,
          { replacements: { thirtyDaysAgo }, type: QueryTypes.SELECT }
        );

      return res.json({
        chains,
        nodes,
        contractCategories,
        notificationCategories,
        chainCategories,
        chainCategoryTypes,
        recentThreads: threadCountQueryData,
        loggedIn: false,
      });
    }

    const unfilteredAddresses = await user.getAddresses();
    // TODO: fetch all this data with a single query
    const [
      addresses,
      socialAccounts,
      selectedChain,
      isAdmin,
      disableRichText,
      lastVisited,
    ] = await Promise.all([
      unfilteredAddresses.filter((address) => !!address.verified),
      user.getSocialAccounts(),
      user.getSelectedChain(),
      user.isAdmin,
      user.disableRichText,
      user.lastVisited,
    ]);

    // look up my roles & private communities
    const myAddressIds: number[] = Array.from(
      addresses.map((address) => address.id)
    );
    const roles = await models.Role.findAll({
      where: {
        address_id: { [Op.in]: myAddressIds },
      },
      include: [models.Address],
    });
    const discussionDrafts = await models.DiscussionDraft.findAll({
      where: {
        address_id: { [Op.in]: myAddressIds },
      },
      include: [models.Address, models.Attachment],
    });

    const threadCountQueryData: ThreadCountQueryData[] =
      await models.sequelize.query(
        `
      SELECT "Threads".chain, COUNT("Threads".id) 
      FROM "Threads"
      WHERE 
        "Threads".deleted_at IS NULL
          AND NOT "Threads".pinned
          AND "Threads".chain IS NOT NULL
      GROUP BY "Threads".chain;
      `,
        {
          replacements: {
            thirtyDaysAgo,
          },
          type: QueryTypes.SELECT,
        }
      );

    // get starred communities for user
    const starredCommunities = await models.StarredCommunity.findAll({
      where: { user_id: user.id },
    });

    // get invites for user
    const invites = await models.InviteCode.findAll({
      where: {
        invited_email: user.email,
        used: false,
      },
    });

    // TODO: Remove or guard JSON.parse calls since these could break the route if there was an error
    /**
     * Purpose of this section is to count the number of threads that have new updates grouped by community
     */
    const commsAndChains = Object.entries(JSON.parse(user.lastVisited));
    const unseenPosts = {};
    let query = ``;
    let replacements = [];

    // this loops through the communities/chains for which we want to see if there are any new updates
    // for each community a UNION SELECT query is appended to the query so that that communities updated threads are
    // included in the final result. This method allows us to submit a single query for all the communities rather
    // than a new query for each community
    for (let i = 0; i < commsAndChains.length; i++) {
      const name = commsAndChains[i][0];
      let time: any = commsAndChains[i][1];
      time = new Date(time as string)

      // if time is invalid reset + skip this chain
      if (Number.isNaN(time.getDate())) {
        unseenPosts[name] = {};
        continue;
      }

      // adds a union between SELECT queries if the number of SELECT queries is greater than 1
      if (i != 0) query += ' UNION '
      // add the chain and timestamp to replacements so that we can safely populate the query with dynamic parameters
      replacements.push(name, time.getTime());
      // append the SELECT query
      query += `SELECT id, chain FROM "Threads" WHERE (kind IN ('forum', 'link') OR chain = ?) AND created_at > TO_TIMESTAMP(?)`
      if (i == commsAndChains.length - 1) query += ';';
    }

    // populate the query replacements and execute the query
    const threadNum: {id: string, chain: string}[] = <any>(await sequelize.query(query, {
      raw: true, type: QueryTypes.SELECT, replacements
    }));

    // this section iterates through the retrieved threads counting the number of threads and keeping a set of activePosts
    // the set of activePosts is used to compare with the comments under threads so that there are no duplicate active threads counted
    for (const thread of threadNum) {
      if (!unseenPosts[thread.chain]) unseenPosts[thread.chain] = {}
      unseenPosts[thread.chain].activePosts ? unseenPosts[thread.chain].activePosts.add(thread.id) : unseenPosts[thread.chain].activePosts = new Set(thread.id);
      unseenPosts[thread.chain].threads ? unseenPosts[thread.chain].threads++ : unseenPosts[thread.chain].threads = 1;
    }

    // reset var
    query = ``;
    replacements = []

    // same principal as the loop above but for comments instead of threads
    for (let i = 0; i < commsAndChains.length; i++) {
      const name = commsAndChains[i][0];
      let time: any = commsAndChains[i][1];
      time = new Date(time as string)

      // if time is invalid reset + skip this chain
      if (Number.isNaN(time.getDate())) {
        unseenPosts[name] = {};
        continue;
      }

      // adds a union between SELECT queries if the number of SELECT queries is greater than 1
      if (i != 0) query += ' UNION ';
      // add the chain and timestamp to replacements so that we can safely populate the query with dynamic parameters
      replacements.push(name, time.getTime())
      // append the SELECT query
      query += `SELECT root_id, chain FROM "Comments" WHERE chain = ? AND created_at > TO_TIMESTAMP(?)`
      if (i == commsAndChains.length - 1) query += ';';
    }

    // populate query and execute
    const commentNum: {root_id: string, chain: string}[] = <any>(await sequelize.query(query, {
      raw: true, type: QueryTypes.SELECT, replacements
    }));

    // iterates through the retrieved comments and adds each thread id to the activePosts set
    for (const comment of commentNum) {
      if (!unseenPosts[comment.chain]) unseenPosts[comment.chain] = {}
      // extract the thread id from the comments root id
      const id = comment.root_id.split('_')[1];
      unseenPosts[comment.chain].activePosts ? unseenPosts[comment.chain].activePosts.add(id) : unseenPosts[comment.chain].activePosts = new Set(id);
      unseenPosts[comment.chain].comments ? unseenPosts[comment.chain].comments++ : unseenPosts[comment.chain].comments = 1;
    }

    // set the activePosts to num in set
    for (const chain of commsAndChains) {
      // again checks for invalid time values
      const [name, time] = chain;
      if (Number.isNaN(new Date(time as string).getDate())) {
        unseenPosts[name] = {};
        continue;
      }
      // if the time is valid but the chain is not defined in the unseenPosts object then initialize the object with zeros
      if (!unseenPosts[name]) {
        unseenPosts[name] = {
          activePosts: 0,
          threads: 0,
          comments: 0
        }
      } else {
        // if the chain does have activePosts convert the set of ids to simply the length of the set
        unseenPosts[name].activePosts = unseenPosts[name].activePosts.size;
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

    const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    return res.json({
      chains,
      nodes,
      contractCategories,
      notificationCategories,
      chainCategories,
      chainCategoryTypes,
      recentThreads: threadCountQueryData,
      roles,
      invites,
      loggedIn: true,
      user: {
        email: user.email,
        emailVerified: user.emailVerified,
        emailInterval: user.emailNotificationInterval,
        jwt: jwtToken,
        addresses,
        socialAccounts,
        selectedChain,
        isAdmin,
        disableRichText,
        lastVisited: JSON.parse(lastVisited),
        starredCommunities,
        discussionDrafts,
        unseenPosts,
      },
    });
  } catch (error) {
    console.log(error);
    throw new ServerError('something broke', error);
  }
};

export default status;
