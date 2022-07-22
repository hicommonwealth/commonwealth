import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { ServerError } from '../util/errors';
import validateChain from '../util/validateChain';
import { DB } from '../database';

const getThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new Error(error));

  let threads;
  try {
    threads = await models.Thread.findAll({
      where: {
        id: { [Op.in]: req.query.ids },
        chain: chain.id
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
          model: models.OffchainTopic,
          as: 'topic',
        },
        {
          model: models.ChainEntity,
        },
        {
          model: models.OffchainReaction,
          as: 'reactions',
          include: [
            {
              model: models.Address,
              as: 'Address',
              required: true,
            },
          ],
        },
        {
          model: models.LinkedThread,
          as: 'linked_threads',
        },
      ],
    });
  } catch (e) {
    console.log(e);
    throw new ServerError(error)
  }

  return threads.length
    ? res.json({ status: 'Success', result: threads.map((th) => th.toJSON()) })
    : res.json({ status: 'Failure' });
};

export default getThreads;
