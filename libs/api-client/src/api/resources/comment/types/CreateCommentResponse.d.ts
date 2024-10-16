/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';
export interface CreateCommentResponse {
  id?: number;
  threadId: number;
  addressId: number;
  text: string;
  parentId?: string;
  contentUrl?: string;
  canvasSignedData?: string;
  canvasMsgId?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  markedAsSpamAt?: Date;
  discordMeta?: CommonApi.CreateCommentResponseDiscordMeta;
  reactionCount: number;
  reactionWeightsSum?: number;
  search: CommonApi.CreateCommentResponseSearch;
  address?: CommonApi.CreateCommentResponseAddress;
  thread?: CommonApi.CreateCommentResponseThread;
  reaction?: CommonApi.CreateCommentResponseReaction;
  commentVersionHistories?: CommonApi.CreateCommentResponseCommentVersionHistoriesItem[];
  communityId: string;
}
