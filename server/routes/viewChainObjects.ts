import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const viewChainObjects = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.query.object_type) {
    return next(new Error('Must provide object_type'));
  }
  const options: any = {
    where: { object_type: req.query.object_type },
  };

  // pass no_sort option if we cannot sort by object id
  // TODO: add a "sort by" field in addition to id and completion
  if (!req.query.no_sort) {
    options.order = [models.sequelize.literal('CAST(object_id AS INTEGER) DESC')];
  }
  if (req.query.completed !== undefined) {
    if (req.query.completed === 'true') {
      options.where.completed = true;
    } else if (req.query.completed === 'false') {
      options.where.completed = false;
    }
    // otherwise, invalid, but just ignore arg
  }
  if (req.query.object_id !== undefined) {
    options.where.object_id = req.query.object_id;
  }

  // this might be the first introduction of pagination into our db!
  // it's optional here, and we should make a helper util to add it elsewhere
  if (req.query.limit !== undefined) {
    options.limit = +req.query.limit;
  }
  if (req.query.offset !== undefined) {
    options.offset = +req.query.offset;
  }
  const objects = await models.ChainObject.findAll(options);
  return res.json({ status: 'Success', result: objects.map((v) => v.toJSON()) });
};

export default viewChainObjects;
