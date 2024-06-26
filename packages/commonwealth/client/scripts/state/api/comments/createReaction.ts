import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { signCommentReaction } from 'client/scripts/controllers/server/sessions';
import { useFlag } from 'hooks/useFlag';
import Reaction from 'models/Reaction';
import { toCanvasSignedDataApiArgs } from 'shared/canvas/types';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
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
      author_community_id: app.user.activeAccount.community.id,
      community_id: communityId,
      address,
      reaction: reactionType,
      jwt: app.user.jwt,
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
        const profileId = app?.user?.addresses?.[0]?.profile?.id;
        markTrainingActionAsComplete(
          UserTrainingCardTypes.GiveUpvote,
          // @ts-expect-error StrictNullChecks
          profileId,
        );
      }

      return reaction;
    },
  });
};

export default useCreateCommentReactionMutation;
