import { Response, NextFunction, Request } from 'express';
import { Op } from 'sequelize';

export const Errors = {
  NeedChain: 'Must provide a chain to fetch entities from',
  InvalidChain: 'Invalid chain',
};

const bulkEntities = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.query.chain) {
    return next(new Error(Errors.NeedChain));
  }

  const chain = await models.Chain.findOne({
    where: { id: req.query.chain }
  });
  if (!chain) {
    return next(new Error(Errors.InvalidChain));
  }

  const entityFindOptions: any = {
    include: [ {
      model: models.ChainEvent,
      order: [
        [ models.ChainEvent, 'id', 'asc' ]
      ],
      include: [ models.ChainEventType ],
    } ],
    order: [['created_at', 'DESC']],
    where: {
      chain: req.query.chain,
    }
  };
  if (req.query.id) {
    entityFindOptions.where.id = req.query.id;
  }
  if (req.query.type) {
    entityFindOptions.where.type = req.query.type;
  }
  if (req.query.type_id) {
    entityFindOptions.where.type_id = req.query.type_id;
  }
  if (req.query.completed) {
    entityFindOptions.where.completed = true;
  }
  if (!req.query.include_preimage) {
    entityFindOptions.where.type = { [Op.notLike]: '%preimage%' };
  }
  const entities = await models.ChainEntity.findAll(entityFindOptions);
  return res.json({ status: 'Success', result: entities.map((e) => e.toJSON()) });
};

export default bulkEntities;
