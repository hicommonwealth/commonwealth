import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { LinkSource, type Link } from '@hicommonwealth/shared';
import type { NextFunction } from 'express';
import { Op } from 'sequelize';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { Errors } from '../../util/linkingValidationHelper';

type GetLinksReq = {
  thread_id?: number;
  linkType: LinkSource[];
  link?: Link;
};

type GetLinksRes = {
  links?: Link[];
  threads?: {
    id: number;
    title: string;
  }[];
};

const getLinks = async (
  models: DB,
  req: TypedRequestBody<GetLinksReq>,
  res: TypedResponse<GetLinksRes>,
  next: NextFunction,
) => {
  const { thread_id, linkType, link } = req.body;
  let links;
  let threads: Array<{ id: number; title: string }>;
  if (!link && !thread_id) {
    return next(new AppError(Errors.InvalidParameter));
  }
  if (thread_id) {
    const thread = await models.Thread.findOne({
      where: {
        id: thread_id,
      },
    });
    if (!thread) return next(new AppError(Errors.NoThread));
    links = linkType
      ? thread.links.filter((items) => {
          return linkType.includes(items.source);
        })
      : thread.links;
  }
  if (link) {
    const matchThreads = await models.Thread.findAll({
      where: {
        links: {
          [Op.contains]: [{ source: link.source, identifier: link.identifier }],
        },
      },
    });
    threads =
      matchThreads.length > 0
        ? matchThreads.map((thr) => {
            return { id: thr.id, title: thr.title };
          })
        : [];
  }

  return success(res, { links, threads });
};

export default getLinks;
