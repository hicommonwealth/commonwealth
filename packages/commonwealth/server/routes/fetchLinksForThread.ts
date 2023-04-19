import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';

export const Errors = {
    NoThread: 'Cannot find thread',
};

const fetchLinksForThread = async (
    models: DB,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { thread_id } = req.query;
    const thread = await models.Thread.findOne({
        where: {
          id: thread_id,
        },
    });
    if (!thread) return next(new AppError(Errors.NoThread));
    return res.json({
        status: 'Success',
        result: thread.links,
    });
}

export default fetchLinksForThread;