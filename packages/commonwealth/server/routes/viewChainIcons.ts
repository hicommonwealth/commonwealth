import { Request, Response, NextFunction } from 'express';
import {DB} from "../database";
import {AppError} from "common-common/src/errors";

const viewChainIcons = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.query.chains) {
    return next(new AppError("Must provide a list of chains"))
  }

  const iconUrls = await models.Chain.findAll({
    attributes: ['id', 'icon_url'],
    where: {
      id: req.query.chains
    }
  });

  return res.json({ status: 'Success', result: iconUrls });
};

export default viewChainIcons;
