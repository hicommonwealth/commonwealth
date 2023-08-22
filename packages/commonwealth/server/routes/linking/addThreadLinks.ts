import { AppError } from 'common-common/src/errors';
import type { NextFunction } from 'express';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { Link, LinkSource, ThreadInstance } from '../../models/thread';
import type { DB } from '../../models';
import { Errors, isAuthorOrAdmin } from '../../util/linkingValidationHelper';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { ServerAnalyticsController } from '../../controllers/server_analytics_controller';

type AddThreadLinkReq = {
  thread_id: number;
  links: Link[];
};

type AddThreadLinkRes = ThreadInstance;

const addThreadLink = async (
  models: DB,
  req: TypedRequestBody<AddThreadLinkReq>,
  res: TypedResponse<AddThreadLinkRes>,
  next: NextFunction
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
    thread.chain
  );
  if (!isAuth && !req.user.isAdmin)
    return next(new AppError(Errors.NotAdminOrOwner));

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

  const serverAnalyticsController = new ServerAnalyticsController();
  serverAnalyticsController.track(
    {
      event: MixpanelCommunityInteractionEvent.LINKED_PROPOSAL,
    },
    req
  );

  return success(res, finalThread.toJSON());
};

export default addThreadLink;
