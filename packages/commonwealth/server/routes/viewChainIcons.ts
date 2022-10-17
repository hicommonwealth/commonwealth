import { Request, Response, NextFunction } from 'express';
import {DB} from "../models";
import {AppError} from "common-common/src/errors";

const viewChainIcons = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.chains) {
    return next(new AppError("Must provide a list of chains"))
  }
  const chains = JSON.parse(req.body.chains)

  const iconUrls = await models.Chain.findAll({
    attributes: ['id', 'icon_url'],
    where: {
      id: chains
    },
    raw: true
  });

  return res.json({ status: 'Success', result: iconUrls });
};

export default viewChainIcons;
