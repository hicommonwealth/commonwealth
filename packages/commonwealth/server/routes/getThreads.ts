import type { DB } from '../models';
import { ServerError } from 'common-common/src/errors';
import type { Request, Response } from 'express';
import { Op } from 'sequelize';

const getThreads = async (models: DB, req: Request, res: Response) => {
  const chain = req.chain;

  let threads;
  try {
    threads = await models.Thread.findAll({
      where: {
        id: { [Op.in]: req.query.ids },
        chain: chain.id,
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
          as: 'chain_entity_meta',
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
    throw new ServerError(e);
  }

  return threads.length
    ? res.json({ status: 'Success', result: threads.map((th) => th.toJSON()) })
    : res.json({ status: 'Failure' });
};

export default getThreads;
