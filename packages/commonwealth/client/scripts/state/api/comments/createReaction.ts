import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { signCommentReaction } from 'controllers/server/sessions';
import { useFlag } from 'hooks/useFlag';
import Reaction from 'models/Reaction';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import useUserStore, { userStore } from '../../ui/user';
import useFetchCommentsQuery from './fetchComments';

interface CreateReactionProps {
  address: string;
  reactionType?: 'like';
  communityId: string;
  threadId: number;
  commentId: number;
}

const createReaction = async ({
  address,
  reactionType = 'like',
  communityId,
  commentId,
}: CreateReactionProps) => {
  const canvasSignedData = await signCommentReaction(address, {
    comment_id: commentId,
    like: reactionType === 'like',
  });

  return await axios.post(
    `${app.serverUrl()}/comments/${commentId}/reactions`,
    {
      author_community_id: userStore.getState().activeAccount?.community?.id,
      community_id: communityId,
      address,
      reaction: reactionType,
      jwt: userStore.getState().jwt,
      ...toCanvasSignedDataApiArgs(canvasSignedData),
      comment_id: commentId,
    },
  );
};

const useCreateCommentReactionMutation = ({
  threadId,
  commentId,
  communityId,
}: Partial<CreateReactionProps>) => {
  const userOnboardingEnabled = useFlag('userOnboardingEnabled');
  const queryClient = useQueryClient();
  const { data: comments } = useFetchCommentsQuery({
    // @ts-expect-error StrictNullChecks
    communityId,
    // @ts-expect-error StrictNullChecks
    threadId,
  });
  const user = useUserStore();

  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  return useMutation({
    mutationFn: createReaction,
    onSuccess: async (response) => {
      const reaction = response.data.result;

      // update fetch comments query state
      const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData(key, () => {
        const tempComments = [...comments];
        const commentToUpdate = tempComments.find((x) => x.id === commentId);
        reaction.Address.User = {
          Profiles: [commentToUpdate.profile],
        };
        commentToUpdate.reactions.push(new Reaction(reaction));
        return tempComments;
      });

      if (userOnboardingEnabled) {
        const profileId = user.addresses?.[0]?.profile?.id;
        profileId &&
          markTrainingActionAsComplete(
            UserTrainingCardTypes.GiveUpvote,
            profileId,
          );
      }

      return reaction;
    },
  });
};

export default useCreateCommentReactionMutation;
