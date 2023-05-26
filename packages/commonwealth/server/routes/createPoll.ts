import { AppError, ServerError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import { getNextPollEndingTime } from '../../shared/utils';
import type { DB } from '../models';
import { findOneRole } from '../util/roles';

export const Errors = {
  NoThreadId: 'Must provide thread_id',
  NoThread: 'Cannot find thread',
  InvalidContent: 'Invalid poll content',
  InvalidDuration: 'Invalid poll duration',
  NotAuthor: 'Only the thread author can start polling',
  MustBeAdmin: 'Must be admin to create poll',
};

// TODO Graham 22-05-06: delete and update functionality should eventually be supported

const createPoll = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;

  const { thread_id, prompt, options } = req.body;
  let { custom_duration } = req.body;
  if (!thread_id) return next(new AppError(Errors.NoThreadId));

  if (custom_duration && custom_duration !== 'Infinite') {
    custom_duration = Number(custom_duration);
    if (
      !Number.isInteger(custom_duration) ||
      custom_duration < 0 ||
      custom_duration > 31
    ) {
      return next(new AppError(Errors.InvalidDuration));
    }
  }
  const ends_at =
    custom_duration === 'Infinite'
      ? null
      : custom_duration
      ? moment().add(custom_duration, 'days').toDate()
      : moment().add(5, 'days').toDate();

  try {
    const thread = await models.Thread.findOne({
      where: {
        id: thread_id,
      },
    });
    if (!thread) return next(new AppError(Errors.NoThread));
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    // TODO Graham 22-05-02: We should allow collaborators to start polling too
    if (!req.user || !userOwnedAddressIds.includes(thread.address_id)) {
      return next(new AppError(Errors.NotAuthor));
    }

    // check if admin_only flag is set
    if (thread.Chain?.admin_only_polling) {
      const role = await findOneRole(
        models,
        { where: { address_id: thread.address_id } },
        thread.Chain.id,
        ['admin']
      );
      if (role && !req.user.isAdmin) {
        return next(new AppError(Errors.MustBeAdmin));
      }
    }

    thread.has_poll = true;
    await thread.save();

    const finalPoll = await models.Poll.create({
      thread_id,
      chain_id: chain.id,
      prompt,
      options,
      ends_at,
    });

    return res.json({ status: 'Success', result: finalPoll.toJSON() });
  } catch (e) {
    return next(new ServerError(e));
  }
};

export default createPoll;
