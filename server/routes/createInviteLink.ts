import crypto from 'crypto';
import { factory, formatFilename } from '../../shared/logging';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));
export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoTimeLimit: 'Must provide a time limit',
  NotAdminMod: 'Must be an admin/mod to create invite links in this community',
  InvalidUses: 'Must provide a valid number of uses',
};

const createInviteLink = async (models: DB, req, res, next) => {
  const [chain, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const { time } = req.body;
  if (!time) return next(new Error(Errors.NoTimeLimit));

  const chainOrCommunityObj = { chain_id: chain.id }

  // if (community && !community.invites_enabled) {
  //   const requesterIsAdminOrMod = await models.Role.findAll({
  //     where: {
  //       address_id: req.user.address_id || null, // this is overriding the search, bc null
  //       chain_id: community.id,
  //       // offchain_community_id: community.id,
  //       permission: ['admin', 'moderator'],
  //     },
  //   });
  //   if (!requesterIsAdminOrMod) return next(new Error(Errors.NotAdminMod));
  // }

  let { uses } = req.body;
  if (uses === 'none') {
    uses = null;
  } else {
    uses = +uses;
  }
  if (Number.isNaN(uses)) {
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
