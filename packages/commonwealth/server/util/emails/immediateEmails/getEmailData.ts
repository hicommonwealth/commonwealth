import { NotificationCategories } from 'common-common/src/types';
import { NotificationDataAndCategory } from 'types';
import { formatAddressShort } from '../../../../shared/utils';
import { SERVER_URL } from '../../../config';
import models from '../../../database';
import {
  getActorProfile,
  getThreadSummaryFromNotification,
  getThreadUrlFromNotification,
} from '../../webhooks/util';

export interface ForumEmailData {
  emailSubject: string;
  actionCopy: string;
  communityCopy: string;

  profileName: string;
  profileUrl: string;

  objectTitle: string;
  objectUrl: string;
  objectSummary: string;
}

export async function getEmailData(
  notification: Exclude<
    NotificationDataAndCategory,
    | { categoryId: NotificationCategories.SnapshotProposal }
    | { categoryId: NotificationCategories.ThreadEdit }
    | { categoryId: NotificationCategories.CommentEdit }
  >
): Promise<ForumEmailData> {
  if (notification.categoryId === NotificationCategories.ChainEvent) {
  } else {
    let title: string;
    try {
      title = decodeURIComponent(notification.data.root_title).trim();
    } catch (e) {
      title = notification.data.root_title;
    }

    let emailSubject: string;
    switch (notification.categoryId) {
      case NotificationCategories.NewComment:
        emailSubject = `Comment on: ${title}`;
        break;
      case NotificationCategories.NewMention:
        emailSubject = `You were mentioned in: ${title}`;
        break;
      case NotificationCategories.NewCollaboration:
        emailSubject = `You were added as a collaborator on: ${title}`;
        break;
      case NotificationCategories.NewThread:
        emailSubject = `New thread: ${title}`;
        break;
      default:
        emailSubject = `New activity on Commonwealth`;
    }

    const authorProfile = await getActorProfile(notification);

    let profileName: string;
    if (authorProfile?.profile_name) profileName = authorProfile.profile_name;
    else {
      profileName = formatAddressShort(
        notification.data.author_address,
        notification.data.author_chain,
        true
      );
    }

    let actionCopy: string;
    switch (notification.categoryId) {
      case NotificationCategories.NewComment:
        actionCopy = 'commented on';
        break;
      case NotificationCategories.NewThread:
        actionCopy = 'created a new thread';
        break;
      case NotificationCategories.NewMention:
        actionCopy = 'mentioned you in the thread';
        break;
      case NotificationCategories.NewCollaboration:
        actionCopy = 'invited you to collaborate on';
        break;
      default:
        actionCopy = null;
    }

    const chain = await models.Chain.findOne({
      where: {
        id: notification.data.chain_id,
      },
    });

    return {
      emailSubject,
      actionCopy,
      communityCopy: chain ? `in ${chain.name}` : '',

      profileName,
      profileUrl: authorProfile
        ? `${SERVER_URL}/profile/id/${authorProfile.id}`
        : null,

      objectTitle: title,
      objectUrl: getThreadUrlFromNotification(notification),
      objectSummary: getThreadSummaryFromNotification(notification),
    };
  }
}
