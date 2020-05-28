import { Request, Response, NextFunction } from 'express';
import { NotificationCategories } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoName: 'Must provide community name',
  NoCreatorAddress: 'Must provide creator address',
  NoCreatorChain: 'Must provide creator chain',
  NoAuthenticatedForumSetting: 'Authenticated forum setting must be \'true\' or false\'',
  NoPrivacySetting: 'Privacy setting must be \'true\' or false\'',
  NoInvitesEnableldSetting: 'Invites setting must be \'true\' or false\'',
  CommunityNameExists: 'The name for this community already exists, please choose another name',
  InvalidAddress: 'Tried to create this community with an invalid address',
};

const createCommunity = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.name || !req.body.name.trim()) {
    return next(new Error(Errors.NoName));
  }
  if (!req.body.creator_address) {
    return next(new Error(Errors.NoCreatorAddress));
  }
  if (!req.body.creator_chain) {
    return next(new Error(Errors.NoCreatorChain));
  }

  if (req.body.isAuthenticatedForum !== 'true' && req.body.isAuthenticatedForum !== 'false') {
    return next(new Error(Errors.NoAuthenticatedForumSetting));
  }
  if (req.body.privacyEnabled !== 'true' && req.body.privacyEnabled !== 'false') {
    return next(new Error(Errors.NoPrivacySetting));
  }
  if (req.body.invitesEnabled !== 'true' && req.body.invitesEnabled !== 'false') {
    return next(new Error(Errors.NoInvitesEnableldSetting));
  }
  const isAuthenticatedForum = req.body.isAuthenticatedForum === 'true';
  const privacyEnabled = req.body.privacyEnabled === 'true';
  const invitesEnabled = req.body.invitesEnabled === 'true';

  // Handle the case where a community already exists
  const oldCommunity = await models.OffchainCommunity.findOne({
    where: { name: req.body.name },
  });
  const oldChain = await models.Chain.findOne({
    where: { name: req.body.name },
  });
  if (oldCommunity || oldChain) {
    return next(new Error(Errors.CommunityNameExists));
  }

  const address = await models.Address.findOne({
    where: { address: req.body.creator_address, chain: req.body.creator_chain },
  });
  if (!address || address.user_id !== req.user.id) {
    return next(new Error(Errors.InvalidAddress));
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
