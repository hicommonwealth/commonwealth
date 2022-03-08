import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { getNextOffchainPollEndingTime } from '../../shared/utils';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  AlreadyPolling: 'There is already an active offchain poll for this thread',
  NoThreadId: 'Must provide thread_id',
  NoThread: 'Cannot find thread',
  InvalidContent: 'Invalid poll content',
  NotAuthor: 'Only the thread author can start polling',
  InvalidDuration: 'Invalid poll duration',
};

const updateThreadPolling = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { thread_id } = req.body;
  let { custom_duration } = req.body;
  if (!thread_id) return next(new Error(Errors.NoThreadId));

  if (custom_duration && custom_duration !== 'Infinite') {
    custom_duration = Number(custom_duration);
    if (
      !Number.isInteger(custom_duration) ||
      custom_duration < 0 ||
      custom_duration > 31
    ) {
      return next(new Error(Errors.InvalidDuration));
    }
  }

  try {
    const thread = await models.OffchainThread.findOne({
      where: {
        id: thread_id,
      },
    });
    if (!thread) return next(new Error(Errors.NoThread));
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    // We should allow collaborators to start polling too
    if (!req.user || !userOwnedAddressIds.includes(thread.address_id)) {
      return next(new Error(Errors.NotAuthor));
    }

    // Check that req.body.content is valid JSON, matching { name: string, choices: string[] }
    try {
      const parsedContent = JSON.parse(req.body.content);
      if (
        !parsedContent.name ||
        !parsedContent.choices ||
        typeof parsedContent.name !== 'string' ||
        parsedContent.name.trim() === '' ||
        !Array.isArray(parsedContent.choices) ||
        !parsedContent.choices.every(
          (c) => typeof c === 'string' && c.trim() !== ''
        )
      )
        return next(new Error(Errors.InvalidContent));
    } catch (e) {
      return next(new Error(Errors.InvalidContent));
    }

    // We assume that the server-side time is in sync with client-side time here
    if (thread.offchain_voting_ends_at)
      return next(new Error(Errors.AlreadyPolling));
    const offchain_voting_ends_at =
      custom_duration === 'Infinite'
        ? null
        : custom_duration
        ? moment().add(custom_duration, 'days')
        : getNextOffchainPollEndingTime(moment());
    await thread.update({
      offchain_voting_enabled: true,
      offchain_voting_ends_at,
      offchain_voting_options: req.body.content,
    });

    const finalThread = await models.OffchainThread.findOne({
      where: { id: thread_id },
      include: [
        {
          model: models.Address,
          as: 'Address',
        },
        {
          model: models.Address,
          // through: models.Collaboration,
          as: 'collaborators',
        },
        models.OffchainAttachment,
        {
          model: models.OffchainTopic,
          as: 'topic',
        },
      ],
    });

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default updateThreadPolling;
