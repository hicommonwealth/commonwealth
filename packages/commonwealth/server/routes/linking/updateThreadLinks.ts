import { AppError } from 'common-common/src/errors';
import type { NextFunction } from 'express';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { Link, LinkSource, ThreadInstance } from '../../models/thread';
import type { DB } from '../../models';
import { Errors, isAuthorOrAdmin } from '../../util/linkingValidationHelper';
import { Op } from 'sequelize';

type UpdateLinkReq = {
    chain: string;
    existingLinks: Link[];
    updatedLinks: {
        identifier?: string,
        title?: string,
    }[];
};
  
type UpdateLinkRes = ThreadInstance[];

const updateThreadLinks = async (
    models: DB,
    req: TypedRequestBody<UpdateLinkReq>,
    res: TypedResponse<UpdateLinkRes>,
    next: NextFunction
  ) => {
    const { chain, existingLinks, updatedLinks } = req.body;
    if(existingLinks.length !== updatedLinks.length) return next(new AppError(Errors.UpdateMismatch));
    
    const threads = await models.Thread.findAll({
        where: {
            [Op.and]: [
                {
                    [Op.or]: existingLinks.map(link => {
                        return {links: { [Op.contains]: [{ source: link.source, identifier: link.identifier }] }}
                    })
                },
                {chain: chain}
            ]
        },
    });
    
    if (threads.length < 1) return next(new AppError(Errors.NoThread));

    existingLinks.forEach((exLink, idx) => {
        threads.filter(thread =>
            thread.links.some(threadLink =>
                threadLink.identifier === exLink.identifier &&
                threadLink.source === exLink.source))
        .forEach((indvThread => {
            indvThread.links = indvThread.links.map(indvLink => {
                return indvLink.source === exLink.source && indvLink.identifier === exLink.identifier ?
                {
                    source: indvLink.source,
                    identifier: updatedLinks[idx].identifier ? updatedLinks[idx].identifier : indvLink.identifier,
                    title: updatedLinks[idx].title ? updatedLinks[idx].title : indvLink.title
                } : indvLink;
            })
        }))
    })

    await Promise.all(threads.map((thread) => thread.save()));
    return success(res, threads);
  }
