import { AppError } from 'common-common/src/errors';
import type { NextFunction, Response } from 'express';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { ChainCategoryType } from 'common-common/src/types';

type UpdateChainCategoryReq = {
  category: string;
  chain_id: string;
  auth: string;
  jwt: string;
};

type UpdateChainCategoryRes = {
  chainCategoryMap: { [chain: string]: ChainCategoryType[] };
};

const updateChainCategory = async (
  models: DB,
  req: TypedRequestBody<UpdateChainCategoryReq>,
  res: TypedResponse<UpdateChainCategoryRes>,
  next: NextFunction
) => {
  if (Object.keys(ChainCategoryType).includes(req.body.category)) {
    const chain = await models.Chain.findOne({
      where: {
        id: req.body.chain_id,
      },
    });
    if (!chain) throw new AppError('Invalid Chain Id');

    const existingCategories = chain.category
      ? (chain.category as string[])
      : [];
    if (existingCategories.includes(req.body.category))
      throw new AppError('Chain already include this category');

    existingCategories.push(req.body.category);

    chain.category = existingCategories.toString();
    await chain.save();
    const updatedCategory = {
      [req.body.chain_id]: existingCategories as ChainCategoryType[],
    };
    return success(res, { chainCategoryMap: updatedCategory });
  } else {
    throw new AppError('Not a valid category');
  }
};

export default updateChainCategory;
