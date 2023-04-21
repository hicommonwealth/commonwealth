import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { link, linkSource } from '../../models/thread';
import type { DB } from '../../models';
import { Errors} from 'server/util/linkingValidationHelper';
import { Op } from 'sequelize';

const getLinks = async (
    models: DB,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { thread_id, linkType, link }: 
    { thread_id?: number, linkType: linkSource, link?: link, } = req.body;
    let links;
    let threads;
    if(thread_id){
        const thread = await models.Thread.findOne({
            where: {
                id: thread_id,
            },
        });
        if (!thread) return next(new AppError(Errors.NoThread));
        links = linkType ? thread.links.filter(items => {return items.source == linkType}) : thread.links;
    }else if(link){
        const matchThreads = await models.Thread.findAll({
            where: {
              links: {
                [Op.contains]: [{source: link.source, identifier: link.identifier}]
              }
            }
        });
        threads = matchThreads.length > 0 ? matchThreads.map(thr => {return {id: thr.id, title: thr.title}}) : [];
    } else {
        return next(new AppError(Errors.InvalidParameter))
    }

    return res.json({
        status: 'Success',
        result: {links, threads}
    });
  }

export default getLinks;