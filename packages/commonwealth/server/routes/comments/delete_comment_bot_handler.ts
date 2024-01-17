import { CommentAttributes } from '@hicommonwealth/model';
import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';

type DeleteBotCommentRequestParams = {
  message_id: string;
};

type DeleteCommentResponse = CommentAttributes;

export const deleteBotCommentHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteBotCommentRequestParams>,
  res: TypedResponse<DeleteCommentResponse>,
) => {
  const { user, address, chain: community } = req;
  const { message_id } = req.params;

  await controllers.comments.deleteComment({
    user,
    address,
    community,
    messageId: message_id, // Discord bot only
  });

  return success(res, undefined);
};
