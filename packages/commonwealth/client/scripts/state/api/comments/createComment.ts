import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useQueryClient } from '@tanstack/react-query';
import { signComment } from 'controllers/server/sessions';
import Comment from 'models/Comment';
import { ApiEndpoints } from 'state/api/config';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import { trpc } from '../../../utils/trpcClient';
import { useAuthModalStore } from '../../ui/modals';
import useUserStore from '../../ui/user';
import { updateThreadInAllCaches } from '../threads/helpers/cache';
import useFetchCommentsQuery from './fetchComments';

interface CreateCommentProps {
  communityId: string;
  address: string;
  threadId: number;
  threadMsgId: string;
  unescapedText: string;
  parentCommentId: number | null;
  parentCommentMsgId: string | null;
  existingNumberOfComments: number;
  isPWA?: boolean;
}

export const buildCreateCommentInput = async ({
  address,
  threadId,
  threadMsgId,
  unescapedText,
  parentCommentId = null,
  parentCommentMsgId = null,
}: CreateCommentProps) => {
  const canvasSignedData = await signComment(address, {
    thread_id: threadMsgId,
    body: unescapedText,
    parent_comment_id: parentCommentMsgId,
  });
  return {
    thread_id: threadId,
    thread_msg_id: threadMsgId,
    parent_msg_id: parentCommentMsgId,
    parent_id: parentCommentId ?? undefined,
    text: unescapedText,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

const useCreateCommentMutation = ({
  communityId,
  threadId,
  existingNumberOfComments = 0,
}: Partial<CreateCommentProps>) => {
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    communityId: communityId!,
    threadId: threadId!,
  });

  const user = useUserStore();

  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.comment.createComment.useMutation({
    onSuccess: async (newComment) => {
      // @ts-expect-error StrictNullChecks
      const comment = new Comment(newComment);

      // update fetch comments query state
      const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData(key, () => {
        return [...comments, comment];
      });

      // @ts-expect-error StrictNullChecks
      updateThreadInAllCaches(communityId, threadId, {
        numberOfComments: existingNumberOfComments + 1,
      });

      updateThreadInAllCaches(
        communityId!,
        threadId!,
        { recentComments: [comment] },
        'combineAndRemoveDups',
      );

      const userId = user.addresses?.[0]?.profile?.userId;
      userId &&
        markTrainingActionAsComplete(
          UserTrainingCardTypes.CreateContent,
          userId,
        );
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useCreateCommentMutation;
