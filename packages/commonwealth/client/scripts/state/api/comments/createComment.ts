import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { signComment } from 'controllers/server/sessions';
import Comment from 'models/Comment';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import { trpc } from '../../../utils/trpcClient';
import { useAuthModalStore } from '../../ui/modals';
import useUserStore from '../../ui/user';
import { updateThreadInAllCaches } from '../threads/helpers/cache';

interface CreateCommentProps {
  communityId: string;
  address: string;
  threadId: number;
  threadMsgId: string | null;
  unescapedText: string;
  parentCommentId: number | null;
  parentCommentMsgId: string | null;
  existingNumberOfComments: number;
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
    thread_id: threadMsgId ?? null,
    body: unescapedText,
    parent_comment_id: parentCommentMsgId ?? null,
  });
  return {
    thread_id: threadId,
    thread_msg_id: threadMsgId,
    parent_msg_id: parentCommentMsgId,
    parent_id: parentCommentId ?? undefined,
    body: unescapedText,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

const useCreateCommentMutation = ({
  communityId,
  threadId,
  existingNumberOfComments = 0,
}: Pick<
  CreateCommentProps,
  'communityId' | 'threadId' | 'existingNumberOfComments'
>) => {
  const utils = trpc.useUtils();
  const user = useUserStore();

  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.comment.createComment.useMutation({
    onSuccess: async (newComment) => {
      // @ts-expect-error StrictNullChecks
      const comment = new Comment(newComment);

      // TODO: #8015 - make a generic util to apply cache
      // updates for comments in all possible key combinations
      // present in cache.
      utils.comment.getComments.invalidate();

      updateThreadInAllCaches(communityId || '', threadId, {
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
