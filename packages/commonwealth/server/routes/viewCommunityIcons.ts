import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';

const viewCommunityIcons = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.body.communities) {
    return next(new AppError('Must provide a list of communities'));
  }
  const communities = JSON.parse(req.body.communities);

  const iconUrls = await models.Community.findAll({
    attributes: ['id', 'icon_url'],
    where: {
      id: communities,
    },
    raw: true,
  });

  return res.json({ status: 'Success', result: iconUrls });
};

export default viewCommunityIcons;
