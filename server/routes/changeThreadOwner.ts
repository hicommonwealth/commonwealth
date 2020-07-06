import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Op } from 'sequelize';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Must be logged in',
  NoThreadId: 'Must provide thread id',
  NoThread: 'Cannot find thread',
  NoNewAddress: 'Must provide new address',
  AddressNotOwned: 'New address must be owned by requesting user',
};

const ChangeThreadOwner = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const { address_id, thread_id } = req.body;
  if (!address_id) return next(new Error(Errors.NoNewAddress));
  if (!thread_id) return next(new Error(Errors.NoThreadId));

  // get all user addresses
  const userAddresses = req.user.getAddresses();
  console.dir(userAddresses);
  if (!userAddresses) return next(new Error('Cannot find user addresses'));
  const userAddressIds = userAddresses.map((a) => a.id);

  // find specific address by requester and specification
  const newAddress = await models.Address.findOne({
    where: {
      user_id: req.user.id,
      id: address_id,
    }
  });
  console.dir(newAddress);
  if (!newAddress) return next(new Error(Errors.AddressNotOwned));

  // find thread by user addresses and thread id
  const thread = await models.OffchainThread.findOne({
    where: {
      id: thread_id,
      address_id: {
        [Op.in]: userAddressIds,
      }
    }
  });
  console.dir(thread);
  if (!thread) return next(new Error(Errors.NoThread));

  // update thread to new address id
  thread.address_id = newAddress.id;
  await thread.save();

  return res.json({ status: 'Success', result: thread });
};

export default ChangeThreadOwner;
