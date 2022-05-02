import moment from 'moment';
import { Request, Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
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

const createPoll = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (authorError) return next(new Error(authorError));

  const { thread_id, chain_id, prompt, options } = req.body;
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
  const ends_at =
    custom_duration === 'Infinite'
      ? null
      : custom_duration
      ? moment().add(custom_duration, 'days')
      : getNextOffchainPollEndingTime(moment());

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
    // TODO Graham 22-05-02: We should allow collaborators to start polling too
    if (!req.user || !userOwnedAddressIds.includes(thread.address_id)) {
      return next(new Error(Errors.NotAuthor));
    }

    const finalPoll = await models.OffchainPoll.create({
      thread_id,
      chain_id: chain.id,
      prompt,
      options,
      ends_at,
    });

    return res.json({ status: 'Success', result: finalPoll.toJSON() });
  } catch (e) {
    return next(new Error(e));
  }
};

export default createPoll;
