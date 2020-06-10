import jwt from 'jsonwebtoken';
import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '../config';
import { factory, formatFilename } from '../../shared/logging';
import '../types';

const log = factory.getLogger(formatFilename(__filename));

const status = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [
    chains,
    nodes,
    publicCommunities,
    offchainTags,
    contractCategories,
    notificationCategories
  ] = await Promise.all([
    models.Chain.findAll({
      include: [
        {
          model: models.OffchainTag,
          as: 'tags',
        },
        {
          model: models.ChainObjectVersion,
          as: 'ChainObjectVersion',
          required: false,
          attributes: ['id'],
        }
      ]
    }),
    models.ChainNode.findAll(),
    models.OffchainCommunity.findAll({
      where: { privacyEnabled: false },
      include: {
        model: models.OffchainTag,
        as: 'tags',
      }
    }),
    models.OffchainTag.findAll(),
    models.ContractCategory.findAll(),
    models.NotificationCategory.findAll(),
  ]);
  const { user } = req;

  if (!user) {
    return res.json({
      chains,
      nodes,
      offchainTags,
      contractCategories,
      communities: publicCommunities,
      notificationCategories,
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
  });
  const discussionDrafts = await models.DiscussionDraft.findAll({
    where: {
      author_id: user.id
    }
  });
  const visiblePrivateCommunityIds = Array.from(roles.map((role) => role.offchain_community_id));
  const privateCommunities = await models.OffchainCommunity.findAll({
    where: {
      id: {
        [Op.in]: visiblePrivateCommunityIds,
      },
    },
    include: [{
      model: models.OffchainTag,
      as: 'tags',
    }],
  });
  const allCommunities = _.uniqBy(publicCommunities.concat(privateCommunities), 'id');

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
    offchainTags,
    contractCategories,
    notificationCategories,
    roles,
    invites,
    loggedIn: true,
    user: {
      email: user.email,
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
