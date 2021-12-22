import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoCommunity: 'Must include community ID',
  NotAdminOrMod: 'Must be an admin/mod to create invite links',
  InvalidCommunity: 'Invalid community',
  ErrorFetchingLinks: 'Error fetching links',
};

const getInviteLinks = async (models: DB, req, res, next) => {
  return res.json({ status: 'Failure', message: 'not implemented' });
  /*
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const { community_id } = req.query;
  if (!community_id) return next(new Error(Errors.NoCommunity));

  const address = await models.Address.findOne({
    where: {
      address: req.query.address,
    },
  });

  const requesterIsAdminOrMod = await models.Role.findAll({
    where: {
      address_id: address.id,
      chain_id: community_id,
      // offchain_community_id: community_id,
      permission: ['admin', 'moderator'],
    },
  });
  if (!requesterIsAdminOrMod) return next(new Error(Errors.NotAdminOrMod));

  const community = await models.Chain.findOne({
    where: {
      id: community_id,
    },
  });
  if (!community) return next(new Error(Errors.InvalidCommunity));

  const inviteLinks = await models.InviteLink.findAll({
    where: {
      community_id: community.id,
    },
  });
  if (!inviteLinks) return next(new Error(Errors.ErrorFetchingLinks));

  return res.json({ status: 'Success', result: inviteLinks.map((inv) => inv.toJSON()) });
  */
};

export default getInviteLinks;
