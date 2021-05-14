import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
import { getNextOffchainPollEndingTime } from '../../shared/utils';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  AlreadyPolling: 'There is already an active offchain poll for this thread',
  NoThreadId: 'Must provide thread_id',
  NoThread: 'Cannot find thread',
  NotAuthor: 'Only the thread author can start polling',
};

const updateThreadPolling = async (models, req: Request, res: Response, next: NextFunction) => {
  const { thread_id } = req.body;
  if (!thread_id) return next(new Error(Errors.NoThreadId));

  try {
    const thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id,
      },
    });
    if (!thread) return next(new Error(Errors.NoThread));
    const userOwnedAddressIds = await req.user.getAddresses().filter((addr) => !!addr.verified).map((addr) => addr.id);
    // We should allow collaborators to start polling too
    if (!userOwnedAddressIds.includes(thread.address_id)) {
      return next(new Error(Errors.NotAuthor));
    }

    // We assume that the server-side time is in sync with client-side time here
    if (thread.offchain_voting_ends_at) return next(new Error(Errors.AlreadyPolling));
    await thread.update({
      offchain_voting_ends_at: getNextOffchainPollEndingTime(moment())
    });

    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread_id, },
      include: [
        {
          model: models.Address,
          as: 'Address'
        },
        {
          model: models.Address,
          through: models.Collaboration,
          as: 'collaborators'
        },
        models.OffchainAttachment,
        {
          model: models.OffchainTopic,
          as: 'topic'
        }
      ],
    });

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default updateThreadPolling;
