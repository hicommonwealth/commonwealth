import { QueryTypes } from 'sequelize';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import Web3 from 'web3';
import { providers } from 'ethers';
import { JWT_SECRET, INFURA_API_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '../config';
import { factory, formatFilename } from '../../shared/logging';
import '../types';
import { Erc20DetailedFactory } from '../../eth/types/Erc20DetailedFactory';

const log = factory.getLogger(formatFilename(__filename));

const status = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [
    chains,
    nodes,
    publicCommunities,
    contractCategories,
    notificationCategories
  ] = await Promise.all([
    models.Chain.findAll({
      where: { active: true },
      include: [
        {
          model: models.OffchainTopic,
          as: 'topics',
        },
      ]
    }),
    models.ChainNode.findAll({
      include: [
        {
          model: models.Chain,
          where: { active: true },
        }
      ],
    }),
    models.OffchainCommunity.findAll({
      where: { privacyEnabled: false },
      include: {
        model: models.OffchainTopic,
        as: 'topics',
      }
    }),
    models.ContractCategory.findAll(),
    models.NotificationCategory.findAll(),
  ]);

  const thirtyDaysAgo = new Date((new Date() as any) - 1000 * 24 * 60 * 60 * 30);
  const { user } = req;

  if (!user) {
    const threadCount = {};
    const threadCountQueryData = await models.sequelize.query(`
SELECT CONCAT("OffchainThreads".chain, "OffchainThreads".community), COUNT("OffchainThreads".id)
  FROM "OffchainThreads"
  LEFT JOIN "OffchainCommunities"
    ON "OffchainThreads".community = "OffchainCommunities".id
WHERE "OffchainThreads".updated_at > :thirtyDaysAgo
  AND "OffchainThreads".deleted_at IS NULL
  AND NOT "OffchainThreads".pinned
  AND ("OffchainThreads".chain IS NOT NULL
       OR NOT "OffchainCommunities"."privacyEnabled")
GROUP BY CONCAT("OffchainThreads".chain, "OffchainThreads".community);
`, { replacements: { thirtyDaysAgo }, type: QueryTypes.SELECT });
    threadCountQueryData.forEach((ct) => threadCount[ct.concat] = ct.count);

    return res.json({
      chains,
      nodes,
      contractCategories,
      communities: publicCommunities,
      notificationCategories,
      recentThreads: threadCount,
      loggedIn: false,
    });
  }
  // TODO: fetch all this data with a single query
  const [addresses, socialAccounts, selectedNode, isAdmin, disableRichText, lastVisited] = await Promise.all([
    user.getAddresses().filter((address) => !!address.verified),
    user.getSocialAccounts(),
    user.getSelectedNode(),
    user.isAdmin,
    user.disableRichText,
    user.lastVisited,
  ]);

  // look up my roles & private communities
  const myAddressIds = Array.from(addresses.map((address) => address.id));
  const roles = await models.Role.findAll({
    where: {
      address_id: { [Op.in]: myAddressIds },
    },
    include: [
      models.Address
    ]
  });
  const discussionDrafts = await models.DiscussionDraft.findAll({
    where: {
      address_id: { [Op.in]: myAddressIds }
    },
    include: [
      models.Address,
      models.OffchainAttachment,
    ]
  });

  const visiblePrivateCommunityIds = Array.from(roles.map((role) => role.offchain_community_id)); // both private and public
  const privateCommunities = await models.OffchainCommunity.findAll({
    where: {
      id: {
        [Op.in]: visiblePrivateCommunityIds,
      },
      privacyEnabled: true,
    },
    include: [{
      model: models.OffchainTopic,
      as: 'topics',
    }],
  });
  const allCommunities : any = _.uniqBy(publicCommunities.concat(privateCommunities), 'id');

  const threadCount = {};
    const threadCountQueryData = await models.sequelize.query(`
SELECT CONCAT("OffchainThreads".chain, "OffchainThreads".community), COUNT("OffchainThreads".id)
  FROM "OffchainThreads"
  LEFT JOIN "OffchainCommunities"
    ON "OffchainThreads".community = "OffchainCommunities".id
WHERE "OffchainThreads".updated_at > :thirtyDaysAgo
  AND "OffchainThreads".deleted_at IS NULL
  AND NOT "OffchainThreads".pinned
  AND ("OffchainThreads".chain IS NOT NULL
    OR NOT "OffchainCommunities"."privacyEnabled"
    OR "OffchainCommunities".id IN(:visiblePrivateCommunityIds))
GROUP BY CONCAT("OffchainThreads".chain, "OffchainThreads".community);
`, { replacements: {
  thirtyDaysAgo,
  visiblePrivateCommunityIds: privateCommunities.length > 0 ? privateCommunities.map((c) => c.id) : ['NO_COMMUNITY'],
}, type: QueryTypes.SELECT });
  threadCountQueryData.forEach((ct) => threadCount[ct.concat] = ct.count);

  // get starred communities for user
  const starredCommunities = await models.StarredCommunity.findAll({
    where: { user_id: user.id }
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
  await Promise.all(commsAndChains.map(async (c) => {
    const [name, time] = c;
    if (isNaN(new Date(time as string).getDate())) {
      unseenPosts[name] = {};
      return;
    }
    const threadNum = await models.OffchainThread.findAndCountAll({
      where: {
        kind: { [Op.or]: ['forum', 'link'] },
        [Op.or]: [
          { community: name },
          { chain: name },
        ],
        created_at: { [Op.gt]: new Date(time as string) }
      }
    });
    const commentNum = await models.OffchainComment.findAndCountAll({
      where: {
        [Op.or]: [
          { community: name },
          { chain: name },
        ],
        created_at: { [Op.gt]: new Date(time as string) }
      }
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
      'activePosts': activeThreads.length,
      'threads': threadNum.count,
      'comments': commentNum.count
    };
  }));

  const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
  return res.json({
    chains,
    nodes,
    communities: allCommunities,
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
      unseenPosts
    }
  });
};

export default status;
