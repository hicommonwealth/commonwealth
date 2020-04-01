import jwt from 'jsonwebtoken';
import _ from 'lodash';
import { Response, NextFunction } from 'express';
import { JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '../config';
import { OffchainThreadKind } from '../../client/scripts/models/models';

import { UserRequest } from '../types';

const status = async (models, req: UserRequest, res: Response, next: NextFunction) => {
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
          required: false,
          attributes: ['id', 'name', 'community_id', 'chain_id'],
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
        required: false,
        attributes: ['id', 'name', 'community_id', 'chain_id'],
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
  const [addresses, socialAccounts, memberships, selectedNode, isAdmin, disableRichText, lastVisited] = await Promise.all([
    user.getAddresses().filter((address) => !!address.verified),
    user.getSocialAccounts(),
    user.getMemberships(),
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
      attributes: ['id', 'name', 'community_id', 'chain_id'],
    }],
  });
  const allCommunities = _.uniqBy(publicCommunities.concat(privateCommunities), 'id');

  // get invites for user
  const invites = await models.InviteCode.findAll({
    where: {
      invited_email: req.user.email,
      used: false,
    },
  });

  const commsAndChains = Object.entries(JSON.parse(user.lastVisited));
  const unseenPosts = {};
  await Promise.all(commsAndChains.map(async (c) => {
    const [name, time] = c;
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
    unseenPosts[name] = {
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
      memberships,
      unseenPosts
    }
  });
};

export default status;
