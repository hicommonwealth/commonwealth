import { Response, NextFunction } from 'express';
import { ChainCategoryInstance } from 'server/models/chain_category';
import { success, TypedRequestBody } from '../types';
import { DB } from '../models';
import { AppError, ServerError } from 'common-common/src/errors';

type UpdateChainCategoryReq = Omit<ChainCategoryInstance, 'id'> & {
  create: string;
  auth: string;
  jwt: string;
};

const updateChainCategory = async (
  models: DB,
  req: TypedRequestBody<UpdateChainCategoryReq>,
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
      return success(res, category.toJSON());
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
      return success(res, categoryEntry.toJSON());
    }
    return res.json({ status: 'Success' });
  } else {
    return next(new AppError('No update action specified.'));
  }
};

export default updateChainCategory;
