import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Link, LinkSource } from '../../models/thread';
import type { DB } from '../../models';
import { Errors, isAuthorOrAdmin } from '../../util/linkingValidationHelper';

const deleteThreadLinks = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { thread_id, links }: { thread_id: number; links: Link[] } = req.body;
  if (!links.every((obj) => Object.values(LinkSource).includes(obj.source)))
    return next(new AppError(Errors.InvalidSource));
  const thread = await models.Thread.findOne({
    where: { id: thread_id },
  });
  if (!thread) return next(new AppError(Errors.NoThread));

  const isAuth = await isAuthorOrAdmin(
    models,
    await req.user.getAddresses(),
    thread.address_id,
    thread.chain
  );
  if (!isAuth) return next(new AppError(Errors.NotAdminOrOwner));

  const filteredLinks = thread.links.filter((link) => {
    return !links.some(
      (linkToDelete) =>
        linkToDelete.source === link.source &&
        linkToDelete.identifier === link.identifier
    );
  });
  if (filteredLinks.length == thread.links.length)
    return next(new AppError(Errors.LinkDeleted));
  thread.links = filteredLinks;
  await thread.save();

  const finalThread = await models.Thread.findOne({
    where: { id: thread_id },
  });

  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default deleteThreadLinks;
