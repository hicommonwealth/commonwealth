import { QueryTypes, Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import {
  JWT_SECRET,
} from '../config';
import { factory, formatFilename } from '../../shared/logging';
import '../types';
import { DB } from '../database';
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
    const threadCount = {};
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
    // eslint-disable-next-line no-return-assign
    threadCountQueryData.forEach((ct) => (threadCount[ct.concat] = ct.count));

    return res.json({
      chains,
      nodes,
      contractCategories,
      notificationCategories,
      recentThreads: threadCount,
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

  const threadCount = {};
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
  // eslint-disable-next-line no-return-assign
  threadCountQueryData.forEach((ct) => (threadCount[ct.concat] = ct.count));

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
  await Promise.all(
    commsAndChains.map(async (c) => {
      const [name, time] = c;
      if (Number.isNaN(new Date(time as string).getDate())) {
        unseenPosts[name] = {};
        return;
      }
      const threadNum = await models.OffchainThread.findAndCountAll({
        where: {
          kind: { [Op.or]: ['forum', 'link'] },
          [Op.or]: [{ chain: name }],
          created_at: { [Op.gt]: new Date(time as string) },
        },
      });
      const commentNum = await models.OffchainComment.findAndCountAll({
        where: {
          [Op.or]: [{ chain: name }],
          created_at: { [Op.gt]: new Date(time as string) },
        },
      });
      const activeThreads = [];
      threadNum.rows.forEach((r) => {
        if (!activeThreads.includes(r.id)) activeThreads.push(r.id);
      });
      commentNum.rows.forEach((r) => {
        if (r.root_id.includes('discussion')) {
          const id = Number(r.root_id.split('_')[1]);
          if (!activeThreads.includes(id)) activeThreads.push(id);
        }
      });
      unseenPosts[name] = {
        activePosts: activeThreads.length,
        threads: threadNum.count,
        comments: commentNum.count,
      };
    })
  );

  const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
  return res.json({
    chains,
    nodes,
    contractCategories,
    notificationCategories,
    recentThreads: threadCount,
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
    console.log(error)
    throw new ServerError("something broke", error)
}

};

export default status;
