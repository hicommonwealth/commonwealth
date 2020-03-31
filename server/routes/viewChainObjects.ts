import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const viewChainObjects = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.query.object_type) {
    return next(new Error('Must provide object_type'));
  }
  const options: any = {
    where: { object_type: req.query.object_type },
    order: [models.sequelize.literal('updated_at DESC')],
  };
  if (req.query.completed) {
    if (req.query.completed === 'true') {
      options.where.completed = true;
    } else if (req.query.completed === 'false') {
      options.where.completed = false;
    }
    // otherwise, invalid, but just ignore arg
  }
  if (req.query.object_id) {
    options.where.object_id = req.query.object_id;
  }

  // this might be the first introduction of pagination into our db!
  // it's optional here, and we should make a helper util to add it elsewhere
  if (req.query.page && req.query.page_size) {
    options.limit = +req.query.limit;
    options.offset = +req.query.limit * +req.query.page_size;
  }
  const objects = await models.ChainObject.findAll(options);
  return res.json({ status: 'Success', result: objects.map((v) => v.toJSON()) });
};

export default viewChainObjects;
