import { AppError } from 'common-common/src/errors';
import type { Request, Response } from 'express';
import { success } from '../../types';
import { ServerControllers } from 'server/routing/router';

export const Errors = {
  InvalidThreadId: 'Thread ID invalid',
  NotLoggedIn: 'Not logged in',
};

export const archiveThreadHandler = async (
  controllers: ServerControllers,
  req: Request,
  res: Response
) => {
  const threadId = req.params.id;
  if (!threadId) {
    throw new AppError(Errors.InvalidThreadId);
  }
  if (!req.user) {
    throw new AppError(Errors.NotLoggedIn);
  }

  const updatedThread = await controllers.threads.archiveOrUnarchiveThread(
    req.user,
    threadId,
    true
  );

  return success(res, updatedThread);
};
