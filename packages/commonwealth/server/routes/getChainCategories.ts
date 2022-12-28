import { Request, Response } from 'express';
import { DB } from '../models';

export const getChainCategories = async (
  models: DB,
  req: Request,
  res: Response
) => {
  const chainCategories = await models.ChainCategory.findAll();

  return res.json({
    chainCategories
  });
};