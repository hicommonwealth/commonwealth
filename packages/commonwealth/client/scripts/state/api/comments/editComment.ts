import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { signUpdateComment } from 'controllers/server/sessions';
import Comment from 'models/Comment';
import { IUniqueId } from 'models/interfaces';
import { trpc } from 'utils/trpcClient';
import { UserProfile } from '../../../models/MinimumProfile';
import { useAuthModalStore } from '../../ui/modals';
import { userStore } from '../../ui/user';
import { updateThreadInAllCaches } from '../threads/helpers/cache';

interface EditCommentProps {
  profile: UserProfile;
  communityId: string;
  commentId: number;
  commentMsgId: string;
  updatedBody: string;
}

export const buildUpdateCommentInput = async ({
  profile,
  communityId,
  commentId,
  commentMsgId,
  updatedBody,
}: EditCommentProps) => {
  const canvasSignedData = await signUpdateComment(profile.address, {
    comment_id: commentMsgId,
    body: updatedBody,
  });

  return {
    address: profile.address,
    author_community_id: communityId,
    comment_id: commentId,
    community_id: communityId,
    body: updatedBody,
    jwt: userStore.getState().jwt,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

interface UseEditCommentMutationProps {
  communityId: string;
  threadId: number;
}

const useEditCommentMutation = ({
  communityId,
  threadId,
}: UseEditCommentMutationProps) => {
  const utils = trpc.useUtils();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.comment.updateComment.useMutation({
    onSuccess: async (updatedComment) => {
      // @ts-expect-error StrictNullChecks
      const comment = new Comment(updatedComment);

      // reset comments cache state
      utils.comment.getComments.invalidate().catch(console.error);

      updateThreadInAllCaches(
        communityId,
        threadId,
        { recentComments: [comment as Comment<IUniqueId>] },
        'combineAndRemoveDups',
      );
      return comment;
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useEditCommentMutation;
