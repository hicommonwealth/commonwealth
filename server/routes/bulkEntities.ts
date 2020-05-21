import { Response, NextFunction, Request } from 'express';

const bulkEntities = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.query.chain) {
    return next(new Error('must specify entity chain'));
  }

  const chain = await models.Chain.findOne({
    where: { id: req.query.chain }
  });
  if (!chain) {
    return next(new Error('Invalid chain'));
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
  const entities = await models.ChainEntity.findAll(entityFindOptions);
  return res.json({ status: 'Success', result: entities.map((e) => e.toJSON()) });
};

export default bulkEntities;
