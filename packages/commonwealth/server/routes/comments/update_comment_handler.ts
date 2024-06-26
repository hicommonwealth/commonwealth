import { CommentAttributes, IDiscordMeta } from '@hicommonwealth/model';
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
  const { user, address } = req;
  // @ts-expect-error StrictNullChecks
  const { id: commentId } = req.params;
  // @ts-expect-error StrictNullChecks
  const { body: commentBody, discord_meta: discordMeta } = req.body;

  const [updatedComment] = await controllers.comments.updateComment({
    // @ts-expect-error StrictNullChecks
    user,
    // @ts-expect-error StrictNullChecks
    address,
    commentId,
    commentBody,
    discordMeta,
  });

  return success(res, updatedComment);
};
