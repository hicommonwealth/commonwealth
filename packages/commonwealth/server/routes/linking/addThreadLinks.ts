import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { link } from '../../models/thread';
import type { DB } from '../../models';
import { Errors, isAuthorOrAdmin } from 'server/util/linkingValidationHelper';

const addThreadLink = async (
    models: DB,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { thread_id, links, }: { thread_id: number, links: link[]} = req.body;
    const thread = await models.Thread.findOne({
        where: { id: thread_id }
    })
    if (!thread) return next(new AppError(Errors.NoThread));

    await isAuthorOrAdmin(models,
        (await req.user.getAddresses()), thread.address_id, thread.chain, next);
    
    if(thread.links){
        thread.links.concat(links)
      } else {
        thread.links = links
    }
    await thread.save();

    const finalThread = await models.Thread.findOne({
        where: { id: thread_id },
    });

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  }

  export default addThreadLink;