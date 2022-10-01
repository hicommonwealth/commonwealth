import { Response, NextFunction, Request } from 'express';
import { DB } from '../../database/database';
import { AppError, ServerError } from 'common-common/src/errors';

export const Errors = {
  NeedChainOrType: 'Must provide a chain or event type to fetch entities from',
};

const events = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.query.chain && !req.query.chain_event_type_id) {
    return next(new AppError(Errors.NeedChainOrType));
  }

  const eventTypeOptions: any = {}
  if (req.query.chain) eventTypeOptions.chain = req.query.chain;
  if (req.query.chain_event_type_id) eventTypeOptions.id = req.query.chain_event_type_id;

  const eventOptions: any = {}
  if (req.query.entity_id) eventOptions.entity_id = req.query.entity_id;

  const generalOptions: any = {}
  if (req.query.limit && req.query.limit > 0) generalOptions.limit = req.query.limit;
  if (req.query.ordered) generalOptions.order = [['created_at', 'DESC']];

  const events = await models.ChainEvent.findAll({
    include: {
      model: models.ChainEventType,
      required: true,
      where: eventTypeOptions
    },
    where: eventOptions,
    ...generalOptions,
  });

  return res.json({ status: 'Success', result: events.map((e) => e.toJSON()) });
};

export default events;
