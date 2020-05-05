import { Response, NextFunction } from 'express';
import { NotificationCategories } from '../../shared/types';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const createCommunity = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.name || !req.body.name.trim()) {
    return next(new Error('Must provide community name'));
  }
  if (!req.body.creator_address || !req.body.creator_chain) {
    return next(new Error('Must provide creator address'));
  }
  if (req.body.isAuthenticatedForum !== 'true' && req.body.isAuthenticatedForum !== 'false') {
    return next(new Error('Authenticated forum setting must be \'true\' or false\''));
  }
  if (req.body.privacyEnabled !== 'true' && req.body.privacyEnabled !== 'false') {
    return next(new Error('Privacy setting must be \'true\' or false\''));
  }
  if (req.body.invitesEnabled !== 'true' && req.body.invitesEnabled !== 'false') {
    return next(new Error('Invites setting must be \'true\' or false\''));
  }
  const isAuthenticatedForum = req.body.isAuthenticatedForum === 'true';
  const privacyEnabled = req.body.privacyEnabled === 'true';
  const invitesEnabled = req.body.invitesEnabled === 'true';

  // Handle the case where a community already exists
  const oldCommunity = await models.OffchainCommunity.find({
    where: { name: req.body.name },
  });
  const oldChain = await models.Chain.find({
    where: { name: req.body.name },
  });
  if (oldCommunity || oldChain) {
    return next(new Error('The name for this community already exists, please choose another name'));
  }

  const address = await models.Address.find({
    where: { address: req.body.creator_address, chain: req.body.creator_chain },
  });
  if (!address || address.user_id !== req.user.id) {
    return next(new Error('Tried to create this community with an invalid address'));
  }

  // If there's any whitespace in the community name replace to make a nice url
  const createdId = req.body.name.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
  const communityContent = {
    id: createdId,
    creator_id: address.id,
    name: req.body.name,
    description: req.body.description,
    default_chain: (req.body.default_chain) ? req.body.default_chain : 'ethereum',
    isAuthenticatedForum,
    privacyEnabled,
    invitesEnabled,
  };
  // get community for assigning role
  const community = await models.OffchainCommunity.create(communityContent);
  const roleContent = {
    address_id: address.id,
    offchain_community_id: community.id,
    permission: 'admin',
  };
  const admin = await models.Role.create(roleContent);
  // dispatch role notifications to global community subscribers
  await models.Subscription.emitNotifications(
    models,
    NotificationCategories.NewRoleCreation,
    '', // TODO: what object_id should we use for global subscriptions?
    {
      created_at: new Date(),
      role_id: admin.id,
      author_address: req.body.creator_address,
      chain: req.body.default_chain,
      community: req.body.name,
    },
    {
      user: req.body.creator_address,
      title: 'New Admin',
      chain: req.body.default_chain,
      community: req.body.name,
    },
    req.wss,
    [ req.body.creator_address ],
  );

  return res.json({ status: 'Success', result: community.toJSON() });
};

export default createCommunity;
