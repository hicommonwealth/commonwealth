import { AppError } from '@hicommonwealth/adapters';
import type { DB } from '@hicommonwealth/model';
import { Link, LinkSource, ThreadInstance } from '@hicommonwealth/model';
import type { NextFunction } from 'express';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { Errors, isAuthorOrAdmin } from '../../util/linkingValidationHelper';

type DeleteThreadLinkReq = {
  thread_id: number;
  links: Link[];
};

type DeleteThreadLinkRes = ThreadInstance;

const deleteThreadLinks = async (
  models: DB,
  req: TypedRequestBody<DeleteThreadLinkReq>,
  res: TypedResponse<DeleteThreadLinkRes>,
  next: NextFunction,
) => {
  const { thread_id, links } = req.body;
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
    thread.community_id,
  );
  if (!isAuth) return next(new AppError(Errors.NotAdminOrOwner));

  const filteredLinks = thread.links.filter((link) => {
    return !links.some(
      (linkToDelete) =>
        linkToDelete.source === link.source &&
        linkToDelete.identifier === link.identifier,
    );
  });
  if (filteredLinks.length == thread.links.length)
    return next(new AppError(Errors.LinkDeleted));
  thread.links = filteredLinks;
  await thread.save();

  const finalThread = await models.Thread.findOne({
    where: { id: thread_id },
    include: [
      {
        model: models.Address,
        as: 'Address',
      },
      {
        model: models.Address,
        // through: models.Collaboration,
        as: 'collaborators',
      },
      {
        model: models.Topic,
        as: 'topic',
      },
    ],
  });

  return success(res, finalThread.toJSON());
};

export default deleteThreadLinks;
