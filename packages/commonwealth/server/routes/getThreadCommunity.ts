import { ServerError } from 'common-common/src/errors';
import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import type { DB } from '../models';

const getThreadCommunity = async (models: DB, req: Request, res: Response) => {
  let thread;
  try {
    thread = await models.Thread.findOne({
      where: {
        id: req.query.id,
      },
    });
  } catch (e) {
    console.log(e);
    throw new ServerError(e);
  }

  return res.json({ status: 'Success', result: { chain: thread.chain } });
};

export default getThreadCommunity;
