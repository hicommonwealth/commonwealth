import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const getInviteLinks = async (models, req, res, next) => {
  if (!req.user) return next(new Error('Not logged in'));
  const { community_id } = req.query;
  if (!community_id) return next(new Error('Error finding comunity'));

  const address = await models.Address.findOne({
    where: {
      address: req.query.address,
    },
  });

  const requesterIsAdminOrMod = await models.Role.findAll({
    where: {
      address_id: address.id,
      offchain_community_id: community_id,
      permission: ['admin', 'moderator'],
    },
  });
  if (!requesterIsAdminOrMod) return next(new Error('Must be an admin/mod to create Invite Link'));

  const community = await models.OffchainCommunity.findOne({
    where: {
      id: community_id,
    },
  });
  if (!community) return next(new Error('Invalid community'));

  const inviteLinks = await models.InviteLink.findAll({
    where: {
      community_id: community.id,
    },
  });
  if (!inviteLinks) return next(new Error('Error Fetching Links'));

  return res.json({ status: 'Success', data: inviteLinks });
};

export default getInviteLinks;
