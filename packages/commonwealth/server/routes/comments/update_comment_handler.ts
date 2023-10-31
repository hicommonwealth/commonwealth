import { TypedRequest, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CommentAttributes } from 'server/models/comment';
import {IDiscordMeta} from "../../util/discobotTypes";

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
  res: TypedResponse<UpdateCommentResponse>
) => {
  const { user, chain, address } = req;
  const { id: commentId } = req.params;
  const { body: commentBody, discord_meta: discordMeta } = req.body;

  const [updatedComment, notificationOptions] =
    await controllers.comments.updateComment({
      user,
      address,
      chain,
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
