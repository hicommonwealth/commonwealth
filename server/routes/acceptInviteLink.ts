import moment from 'moment';
import crypto from 'crypto';
import { SERVER_URL } from '../config';

const redirectWithError = (res, message: string) => {
  const uri = `${SERVER_URL}/?invitemessage=failure&message=${encodeURIComponent(message)}`;
  return res.redirect(uri);
};

const redirectWithSuccess = (res) => {
  const uri = `${SERVER_URL}/?invitemessage=success`;
  return res.redirect(uri);
};

const acceptInviteLink = async (models, req, res, next) => {
  if (!req.user) return redirectWithError(res, 'Must be logged in');
  if (!req.user.email) return redirectWithError(res, 'Must have email associated with Commonwealth account');
  const { id } = req.query;

  const inviteLink = await models.InviteLink.findOne({
    where: {
      id,
    }
  });
  if (!inviteLink.active) return redirectWithError(res, 'Invite link expired');

  const { time_limit, multi_use, used, community_id, creator_id } = inviteLink;

  if (multi_use !== null) { // meaning limited usage
    if (used === multi_use) {
      return redirectWithError(res, 'Invite link expired');
    }
  }

  const created_at = moment(inviteLink.created_at);
  if (time_limit !== 'none') {
    const timeElapsed = moment().diff(created_at, 'hours');
    switch (time_limit) {
      case '24h':
        if (timeElapsed > 24) {
          await inviteLink.update({ active: false, });
          return redirectWithError(res, 'Invite link expired');
        }
        break;
      case '48h':
        if (timeElapsed > (24 * 2)) {
          await inviteLink.update({ active: false, });
          return redirectWithError(res, 'Invite link expired');
        }
        break;
      case '1w':
        if (timeElapsed > (24 * 7)) {
          await inviteLink.update({ active: false, });
          return redirectWithError(res, 'Invite link expired');
        }
        break;
      case '1m':
        if (timeElapsed > (24 * 30)) {
          await inviteLink.update({ active: false, });
          return redirectWithError(res, 'Invite link expired');
        }
        break;
      default:
        await inviteLink.update({ active: false, });
        return redirectWithError(res, 'Invite link invalid');
    }
  }

  // check if outstanding invite to community already exists
  const prevInviteCode = await models.InviteCode.findOne({
    where: {
      community_id,
      invited_email: req.user.email,
      used: false,
    }
  });
  if (prevInviteCode) {
    redirectWithSuccess(res);
  }

  const community = await models.OffchainCommunity.findOne({
    where: {
      id: community_id,
    }
  });
  if (!community) {
    return redirectWithError(res, 'Community associated with invite not found!');
  }

  const code = crypto.randomBytes(24).toString('hex');
  const invite = await models.InviteCode.create({
    id: code,
    community_id,
    community_name: community.name,
    creator_id,
    invited_email: req.user.email, // Should we require req.user.email? null is fine too, but can't be fetched via /status/ in the future.
    used: false,
  });
  if (!invite) return redirectWithError(res, 'Failed to create an invite');

  // updating inviteLink checks
  await inviteLink.update({
    used: (used + 1),
  });

  if (inviteLink.used === multi_use) {
    await inviteLink.update({
      active: false,
    });
  }

  return redirectWithSuccess(res);
};

export default acceptInviteLink;
