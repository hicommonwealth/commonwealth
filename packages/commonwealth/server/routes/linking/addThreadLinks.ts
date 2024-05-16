import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { ThreadInstance } from '@hicommonwealth/model';
import { LinkSource, type Link } from '@hicommonwealth/shared';
import type { NextFunction } from 'express';
import {
  MixpanelCommunityInteractionEvent,
  MixpanelErrorCaptureEvent,
} from '../../../shared/analytics/types';
import { ServerAnalyticsController } from '../../controllers/server_analytics_controller';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { Errors, isAuthorOrAdmin } from '../../util/linkingValidationHelper';

type AddThreadLinkReq = {
  thread_id: number;
  links: Link[];
};

type AddThreadLinkRes = ThreadInstance;

const getMixpanelEvent = (source: LinkSource) => {
  switch (source) {
    case LinkSource.Snapshot:
    case LinkSource.Proposal:
      return MixpanelCommunityInteractionEvent.LINKED_PROPOSAL;
    case LinkSource.Thread:
      return MixpanelCommunityInteractionEvent.LINKED_THREAD;
    case LinkSource.Web:
      return MixpanelCommunityInteractionEvent.LINKED_URL;
    case LinkSource.Template:
      return MixpanelCommunityInteractionEvent.LINKED_TEMPLATE;
    default:
      return MixpanelErrorCaptureEvent.UNKNOWN_EVENT;
  }
};

const addThreadLink = async (
  models: DB,
  req: TypedRequestBody<AddThreadLinkReq>,
  res: TypedResponse<AddThreadLinkRes>,
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
  if (!isAuth && !req.user.isAdmin)
    return next(new AppError(Errors.NotAdminOrOwner));

  if (thread.links) {
    const filteredLinks = links.filter((link) => {
      return !thread.links.some(
        (newLinks) =>
          newLinks.source === link.source &&
          newLinks.identifier === link.identifier,
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

  const source = thread.links[thread.links.length - 1].source;
  const event = getMixpanelEvent(source);

  const serverAnalyticsController = new ServerAnalyticsController();
  serverAnalyticsController.track(
    {
      event: event,
      userId: req.user.id,
      community: thread.community_id,
      proposalType: source,
    },
    req,
  );

  return success(res, finalThread.toJSON());
};

export default addThreadLink;
