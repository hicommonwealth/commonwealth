/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';
export interface CreateCommentResponseThread {
  id?: number;
  addressId: number;
  title: string;
  kind: string;
  stage?: string;
  body?: string;
  url?: string;
  topicId?: number;
  pinned?: boolean;
  communityId: string;
  viewCount?: number;
  links?: CommonApi.CreateCommentResponseThreadLinksItem[];
  contentUrl?: string;
  readOnly?: boolean;
  hasPoll?: boolean;
  canvasSignedData?: string;
  canvasMsgId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastEdited?: Date;
  deletedAt?: Date;
  lastCommentedOn?: Date;
  markedAsSpamAt?: Date;
  archivedAt?: Date;
  lockedAt?: Date;
  discordMeta?: CommonApi.CreateCommentResponseThreadDiscordMeta;
  reactionCount?: number;
  reactionWeightsSum?: number;
  commentCount?: number;
  activityRankDate?: Date;
  createdBy?: string;
  profileName?: string;
  search: CommonApi.CreateCommentResponseThreadSearch;
  address?: CommonApi.CreateCommentResponseThreadAddress;
  topic?: CommonApi.CreateCommentResponseThreadTopic;
  collaborators?: CommonApi.CreateCommentResponseThreadCollaboratorsItem[];
  reactions?: CommonApi.CreateCommentResponseThreadReactionsItem[];
  threadVersionHistories?: CommonApi.CreateCommentResponseThreadThreadVersionHistoriesItem[];
}
