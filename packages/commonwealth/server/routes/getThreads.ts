import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { AppError, ServerError } from 'common-common/src/errors';
import validateChain from '../util/validateChain';
import { DB } from '../database';

const getThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new AppError(error));

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
          model: models.Topic,
          as: 'topic',
        },
        {
          model: models.ChainEntityMeta,
          as: 'chain_entity_meta'
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
