import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';

const updateChainCategory = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body.create === 'true') {
    const categoryEntry = await models.ChainCategory.findOne({
      where: {
        chain_id: req.body.chain_id,
        category_type_id: req.body.category_type_id,
      },
    });
    if (!categoryEntry) {
      const category = await models.ChainCategory.create({
        chain_id: req.body.chain_id,
        category_type_id: req.body.category_type_id,
      });
      return res.json({ status: 'Success', result: category.toJSON() });
    }

    return res.json({ status: 'Success' });
  } else if (req.body.create === 'false') {
    const categoryEntry = await models.ChainCategory.findOne({
      where: {
        chain_id: req.body.chain_id,
        category_type_id: req.body.category_type_id,
      },
    });

    if (categoryEntry) {
      await categoryEntry.destroy();
      return res.json({ status: 'Success', result: categoryEntry.toJSON() });
    }
    return res.json({ status: 'Success' });
  } else {
    return next(new Error('No update action specified.'));
  }
};

export default updateChainCategory;
