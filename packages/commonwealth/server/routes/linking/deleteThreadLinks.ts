import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { ThreadInstance } from '@hicommonwealth/model';
import { LinkSource, type Link } from '@hicommonwealth/shared';
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
    // @ts-expect-error StrictNullChecks
    await req.user.getAddresses(),
    thread.address_id,
    thread.community_id,
  );
  if (!isAuth) return next(new AppError(Errors.NotAdminOrOwner));

  // @ts-expect-error StrictNullChecks
  const filteredLinks = thread.links.filter((link) => {
    return !links.some(
      (linkToDelete) =>
        linkToDelete.source === link.source &&
        linkToDelete.identifier === link.identifier,
    );
  });
  // @ts-expect-error StrictNullChecks
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

  // @ts-expect-error StrictNullChecks
  return success(res, finalThread.toJSON());
};

export default deleteThreadLinks;
