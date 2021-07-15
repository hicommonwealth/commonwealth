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
  InvalidContent: 'Invalid poll content',
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
    if (!req.user || !userOwnedAddressIds.includes(thread.address_id)) {
      return next(new Error(Errors.NotAuthor));
    }

    // Check that req.body.content is valid JSON, matching { name: string, choices: string[] }
    try {
      const parsedContent = JSON.parse(req.body.content);
      if (!parsedContent.name || !parsedContent.choices
          || typeof parsedContent.name !== 'string'
          || parsedContent.name.trim() === ''
          || !Array.isArray(parsedContent.choices)
          || !parsedContent.choices.every((c) => typeof c === 'string' && c.trim() !== ''))
        return next(new Error(Errors.InvalidContent));
    } catch (e) {
      return next(new Error(Errors.InvalidContent));
    }

    // We assume that the server-side time is in sync with client-side time here
    if (thread.offchain_voting_ends_at) return next(new Error(Errors.AlreadyPolling));
    await thread.update({
      offchain_voting_ends_at: getNextOffchainPollEndingTime(moment()),
      offchain_voting_options: req.body.content,
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
