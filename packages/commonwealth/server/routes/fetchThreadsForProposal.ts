import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { linkSource } from '../models/thread';
import type { DB } from '../models';
import { Op } from 'sequelize';

export const Errors = {
    NoThread: 'Cannot find thread',
    InvalidSource: 'Invalid proposal source',
    InvalidChain: 'No chain',
};

const fetchThreadsForProposals = async (
    models: DB,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const {source, id, chain} = req.query
    if (!chain) return next(new AppError(Errors.InvalidChain));
    if(typeof linkSource[source as keyof typeof linkSource] === "undefined"){
        new AppError(Errors.InvalidSource);
    }

    const threads = await models.Thread.findAll({
        where: {
          links: {
            [Op.contains]: [{source, identifier: id}]
          }
        }
    });
    if (threads.length < 1) return res.json({ status: 'Failure' });

    return res.json({
        status: 'Success',
        result: threads.map((thread) => {
          return { id: thread.id, title: thread.title };
        }),
    });
}

export default fetchThreadsForProposals;