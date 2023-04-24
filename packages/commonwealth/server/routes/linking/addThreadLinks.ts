import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Link, LinkSource } from '../../models/thread';
import type { DB } from '../../models';
import { Errors, isAuthorOrAdmin } from '../../util/linkingValidationHelper';

const addThreadLink = async (
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

  if (thread.links) {
    const filteredLinks = links.filter((link) => {
      return !thread.links.some(
        (newLinks) =>
          newLinks.source === link.source &&
          newLinks.identifier === link.identifier
      );
    });
    if (filteredLinks.length === 0)
      return next(new AppError(Errors.LinksExist));
    thread.links = thread.links.concat(filteredLinks);
  } else {
    thread.links = links;
  }
  await thread.save();

  const finalThread = await models.Thread.findOne({
    where: { id: thread_id },
  });

  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default addThreadLink;
