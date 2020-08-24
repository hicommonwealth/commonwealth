import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { Errors } from './getOffences';

const Op = Sequelize.Op;

const getSlashes  = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash } = req.query;
  let { startDate, endDate } = req.query;
  let slashes;

  if (!chain) return next(new Error(Errors.ChainIdNotFound));
  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });
  if (!chainInfo) return next(new Error(Errors.InvalidChain));

  // if date isn't defined we get for last 30 days
  if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
    const daysAgo = 30;
    startDate = new Date(); // today
    startDate.setDate(startDate.getDate() - daysAgo); // 30 days ago
    startDate = new Date(startDate); // formatted
    endDate = new Date(); // today
  }
  /**
   * {
        includeAddresses: [ 'Alice' ],
        data: { kind: 'slash', validator: 'Alice', amount: '10000' },
        blockNumber: 10
    }
   */
  if (req.query.stash) {
    slashes = await models.ChainEvent.findAll({
      where: {
        '$ChainEventType.chain$': chain,
        '$ChainEventType.event_name$': 'slash',
        '$ChainEvent.event_data.validator$': stash,
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [
        ['created_at', 'ASC']
      ],
      include: [ { model: models.ChainEventType } ]
    });

    if (slashes) { if (!slashes.length) return []; } else return [];

    return res.json({ status: 'Success', result: { slashes } });
  } else {
    slashes = await models.ChainEvent.findAll({
      where: {
        '$ChainEventType.chain$': chain,
        '$ChainEventType.event_name$': 'slash',
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [
        ['created_at', 'ASC']
      ],
      include: [ { model: models.ChainEventType } ]
    });
    return res.json({ status: 'Success', result: { slashes } });
  }
};

export default getSlashes;
