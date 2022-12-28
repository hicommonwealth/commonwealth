import { Request, Response } from 'express';
import { DB } from '../models';

export const getChainCategoryTypes = async (
  models: DB,
  req: Request,
  res: Response
) => {
  const chainCategoryTypes = await models.ChainCategoryType.findAll();

  return res.json({
    chainCategoryTypes
  });
};