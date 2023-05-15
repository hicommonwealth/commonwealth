import { ServerError } from 'common-common/src/errors';
import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import type { DB } from '../models';
import { validationResult } from 'express-validator';
import { failure } from '../types';

const getThreads = async (models: DB, req: Request, res: Response) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const chain = req.chain;

  let threads;
  try {
    threads = await models.Thread.findAll({
      where: {
        id: { [Op.in]: req.query.ids },
        // chain: req.chain ? req.chain.id : undefined,
      },
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
        {
          model: models.Topic,
          as: 'topic',
        },
        {
          model: models.Reaction,
          as: 'reactions',
          include: [
            {
              model: models.Address,
              as: 'Address',
              required: true,
            },
          ],
        },
      ],
    });
  } catch (e) {
    console.log(e);
    throw new ServerError(e);
  }

  return threads.length
    ? res.json({ status: 'Success', result: threads.map((th) => th.toJSON()) })
    : res.json({ status: 'Failure' });
};

export default getThreads;
