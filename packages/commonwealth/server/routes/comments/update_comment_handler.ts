import { IDiscordMeta } from '@hicommonwealth/core';
import { CommentAttributes } from 'server/models/comment';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type UpdateCommentRequestBody = {
  body: string;
  discord_meta?: IDiscordMeta;
};
type UpdateCommentRequestParams = {
  id: number;
  body: string;
};
type UpdateCommentResponse = CommentAttributes;

export const updateCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<UpdateCommentRequestBody, {}, UpdateCommentRequestParams>,
  res: TypedResponse<UpdateCommentResponse>,
) => {
  const { user, chain: community, address } = req;
  const { id: commentId } = req.params;
  const { body: commentBody, discord_meta: discordMeta } = req.body;

  const [updatedComment, notificationOptions] =
    await controllers.comments.updateComment({
      user,
      address,
      community,
      commentId,
      commentBody,
      discordMeta,
    });

  // emit notifications
  for (const n of notificationOptions) {
    controllers.notifications.emit(n).catch(console.error);
  }

  return success(res, updatedComment);
};
