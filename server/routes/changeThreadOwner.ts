import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Must be logged in',
  NoObjId: 'Must provide thread or comment id',
  NoThread: 'Cannot find thread',
  NoComment: 'Cannot find comment',
  NoNewAddress: 'Must provide new address',
  AddressNotOwned: 'New address must be owned by requesting user',
};

const ChangeThreadOwner = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const { address_id, thread_id, comment_id } = req.body;
  if (!address_id) return next(new Error(Errors.NoNewAddress));
  if (!thread_id || !comment_id) return next(new Error(Errors.NoObjId));

  // get all user addresses
  const userAddresses = await req.user.getAddresses();
  if (!userAddresses) return next(new Error('Cannot find user addresses'));
  const userAddressIds = userAddresses.map((a) => a.id);

  // find specific address by requester and specification
  const newAddress = await models.Address.findOne({
    where: {
      user_id: req.user.id,
      id: address_id,
    }
  });
  if (!newAddress) return next(new Error(Errors.AddressNotOwned));

  if (thread_id) {
    // find thread by user addresses and thread id
    const thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id,
        address_id: {
          [Op.in]: userAddressIds,
        }
      },
      include: [ models.Address, models.OffchainAttachment, { model: models.OffchainTag, as: 'tag' } ],
    });
    if (!thread) return next(new Error(Errors.NoThread));

    // update thread with new address id
    thread.address_id = newAddress.id;
    await thread.save();
    return res.json({ status: 'Success', result: thread.toJSON() });
  } else if (comment_id) {
    // find comment by user addresses and comment id
    const comment = await models.OffchainComment.findOne({
      where: {
        id: comment_id,
        address_id: {
          [Op.in]: userAddressIds,
        }
      },
      include: [models.Address, models.OffchainAttachment],
    });
    if (!comment) return next(new Error(Errors.NoComment));

    // update comment with new address id
    comment.address_id = newAddress.id;
    await comment.save();
    return res.json({ status: 'Success', result: comment.toJSON() });
  } else {
    return res.status(500).json({ error: 'Failed and circumvented checks' });
  }

};

export default ChangeThreadOwner;
