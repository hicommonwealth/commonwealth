import { QueryTypes, Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET } from '../config';
import { factory, formatFilename } from '../../shared/logging';
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
            model: models.OffchainTopic,
            as: 'topics',
          },
        ],
      }),
      models.ChainNode.findAll({
        include: [
          {
            model: models.Chain,
            where: { active: true },
          },
        ],
      }),
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
        SELECT "OffchainThreads".chain, COUNT("OffchainThreads".id) 
        FROM "OffchainThreads"
        WHERE "OffchainThreads".deleted_at IS NULL
        AND NOT "OffchainThreads".pinned
        AND "OffchainThreads".chain IS NOT NULL
        GROUP BY "OffchainThreads".chain;
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
      selectedNode,
      isAdmin,
      disableRichText,
      lastVisited,
    ] = await Promise.all([
      unfilteredAddresses.filter((address) => !!address.verified),
      user.getSocialAccounts(),
      user.getSelectedNode(),
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
      include: [models.Address, models.OffchainAttachment],
    });

    const threadCountQueryData: ThreadCountQueryData[] =
      await models.sequelize.query(
        `
      SELECT "OffchainThreads".chain, COUNT("OffchainThreads".id) 
      FROM "OffchainThreads"
      WHERE 
        "OffchainThreads".deleted_at IS NULL
          AND NOT "OffchainThreads".pinned
          AND "OffchainThreads".chain IS NOT NULL
      GROUP BY "OffchainThreads".chain;
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
    const commsAndChains = Object.entries(JSON.parse(user.lastVisited));
    const unseenPosts = {};

    //////////////////////////////////////////////////////////////////
    let query = ``;

    // create threads query
    let replacements = [];
    for (let i = 0; i < commsAndChains.length; i++) {
      const name = commsAndChains[i][0];
      let time: any = commsAndChains[i][1];
      time = new Date(time as string)
      if (Number.isNaN(time.getDate())) {
        unseenPosts[name] = {};
        continue;
      }

      if (i != 0) query += ' UNION '
      replacements.push(name, time.getTime());
      query += `SELECT id, chain FROM "OffchainThreads" WHERE (kind IN ('forum', 'link') OR chain = ?) AND created_at > TO_TIMESTAMP(?)`
      if (i == commsAndChains.length - 1) query += ';';
    }

    // execute threads query
    const threadNum: {id: string, chain: string}[] = <any>(await sequelize.query(query, {
      raw: true, type: QueryTypes.SELECT, replacements
    }));

    // process returned threads
    for (const thread of threadNum) {
      if (!unseenPosts[thread.chain]) unseenPosts[thread.chain] = {}
      unseenPosts[thread.chain].activePosts ? unseenPosts[thread.chain].activePosts.add(thread.id) : unseenPosts[thread.chain].activePosts = new Set(thread.id);
      unseenPosts[thread.chain].threads ? unseenPosts[thread.chain].threads++ : unseenPosts[thread.chain].threads = 1;
    }

    // create comments query
    query = ``;
    replacements = []
    for (let i = 0; i < commsAndChains.length; i++) {
      const name = commsAndChains[i][0];
      let time: any = commsAndChains[i][1];
      time = new Date(time as string)

      if (Number.isNaN(time.getDate())) {
        unseenPosts[name] = {};
        continue;
      }
      if (i != 0) query += ' UNION ';
      replacements.push(name, time.getTime())
      query += `SELECT root_id, chain FROM "OffchainComments" WHERE chain = ? AND created_at > TO_TIMESTAMP(?)`
      if (i == commsAndChains.length - 1) query += ';';
    }
    const commentNum: {root_id: string, chain: string}[] = <any>(await sequelize.query(query, {
      raw: true, type: QueryTypes.SELECT, replacements
    }));

    for (const comment of commentNum) {
      if (!unseenPosts[comment.chain]) unseenPosts[comment.chain] = {}
      const id = comment.root_id.split('_')[1];
      unseenPosts[comment.chain].activePosts ? unseenPosts[comment.chain].activePosts.add(id) : unseenPosts[comment.chain].activePosts = new Set(id);
    }

    // set the activePosts to num in set
    for (const chain of commsAndChains) {
      const [name, time] = chain;
      if (Number.isNaN(new Date(time as string).getDate())) {
        unseenPosts[name] = {};
        continue;
      }
      if (!unseenPosts[name]) {
        unseenPosts[name] = {
          activePosts: 0,
          threads: 0,
          comments: 0
        }
      } else {
        unseenPosts[name].activePosts = unseenPosts[name].activePosts.size;
      }
    }

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
        selectedNode,
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
