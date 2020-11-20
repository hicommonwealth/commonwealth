import crypto from 'crypto';
import { factory, formatFilename } from '../../shared/logging';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoCommunityId: 'Error finding community or chain',
  NoChainAndCommunity: 'Must provide only chain/community',
  NoTimeLimit: 'Must provide a time limit',
  InvalidCommunity: 'Invalid community',
  NotAdminMod: 'Must be an admin/mod to create invite links in this community',
  InvalidUses: 'Must provide a valid number of uses',
};

const createInviteLink = async (models, req, res, next) => {
  if (!req.body.community && !req.body.chain) return next(new Error(Errors.NoCommunityId));
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const { time } = req.body;
  if (community && chain) return next(new Error(Errors.NoChainAndCommunity));
  if (!time) return next(new Error(Errors.NoTimeLimit));

  const chainOrCommunityObj = chain ? { chain_id: chain.id }
    : { community_id: community.id };

  if (community && !community.invitesEnabled) {
    const requesterIsAdminOrMod = await models.Role.findAll({
      where: {
        address_id: req.user.address_id, // this is overriding the search, bc null
        offchain_community_id: community.id,
        permission: ['admin', 'moderator'],
      },
    });
    if (!requesterIsAdminOrMod) return next(new Error(Errors.NotAdminMod));
  }

  let { uses } = req.body;
  if (uses === 'none') {
    uses = null;
  } else {
    uses = +uses;
  }
  if (isNaN(uses)) {
    return next(new Error(Errors.InvalidUses));
  }

  // check to see if unlimited time + unlimited usage already exists
  if (uses === null && time === 'none') {
    const foreverInvite = await models.InviteLink.findOne({
      where: {
        // community_id: community.id,
        ...chainOrCommunityObj,
        creator_id: req.user.id,
        multi_use: uses, // null
        time_limit: time, // 'none'
      },
    });
    if (foreverInvite) {
      if (foreverInvite.active === false) {
        await foreverInvite.update({ active: true, });
      }
      return res.json({ status: 'Success', result: foreverInvite.toJSON() });
    }
  }

  const inviteId = crypto.randomBytes(24).toString('hex');

  const inviteLink = await models.InviteLink.create({
    id: inviteId,
    // community_id: community.id,
    ...chainOrCommunityObj,
    creator_id: req.user.id,
    active: true,
    multi_use: uses,
    time_limit: time,
    used: 0,
  });
  if (!inviteLink) { return res.json({ status: 'Failure' }); }

  return res.json({ status: 'Success', result: inviteLink.toJSON() });
};

export default createInviteLink;
