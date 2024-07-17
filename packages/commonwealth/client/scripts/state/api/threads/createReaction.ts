import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { signThreadReaction } from 'controllers/server/sessions';
import app from 'state';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import useUserStore, { userStore } from '../../ui/user';
import { updateThreadInAllCaches } from './helpers/cache';

interface IuseCreateThreadReactionMutation {
  threadId: number;
  communityId: string;
}
interface CreateReactionProps extends IuseCreateThreadReactionMutation {
  address: string;
  reactionType?: 'like';
  isPWA?: boolean;
}

const createReaction = async ({
  address,
  reactionType = 'like',
  threadId,
  isPWA,
}: CreateReactionProps) => {
  const canvasSignedData = await signThreadReaction(address, {
    thread_id: threadId,
    like: reactionType === 'like',
  });

  return await axios.post(
    `${app.serverUrl()}/threads/${threadId}/reactions`,
    {
      author_community_id: userStore.getState().activeAccount?.community?.id,
      thread_id: threadId,
      community_id: app.chain.id,
      address,
      reaction: reactionType,
      jwt: userStore.getState().jwt,
      ...toCanvasSignedDataApiArgs(canvasSignedData),
    },
    {
      headers: {
        isPWA: isPWA?.toString(),
      },
    },
  );
};

const useCreateThreadReactionMutation = ({
  communityId,
  threadId,
}: IuseCreateThreadReactionMutation) => {
  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

  const user = useUserStore();

  return useMutation({
    mutationFn: createReaction,
    onSuccess: async (response) => {
      const reaction: any = {
        id: response.data.result.id,
        address: response.data.result.Address.address,
        type: 'like',
        updated_at: response.data.result.updated_at,
        voting_weight: response.data.result.calculated_voting_weight || 1,
      };
      updateThreadInAllCaches(
        communityId,
        threadId,
        { associatedReactions: [reaction] },
        'combineAndRemoveDups',
      );

      const profileId = user.addresses?.[0]?.profile?.id;
      profileId &&
        markTrainingActionAsComplete(
          UserTrainingCardTypes.GiveUpvote,
          profileId,
        );
    },
  });
};

export default useCreateThreadReactionMutation;
