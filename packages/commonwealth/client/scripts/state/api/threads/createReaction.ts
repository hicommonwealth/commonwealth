import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { signThreadReaction } from 'client/scripts/controllers/server/sessions';
import { useFlag } from 'hooks/useFlag';
import { toCanvasSignedDataApiArgs } from 'shared/canvas/types';
import app from 'state';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
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
      author_community_id: app.user.activeAccount.community.id,
      thread_id: threadId,
      community_id: app.chain.id,
      address,
      reaction: reactionType,
      jwt: app.user.jwt,
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
  const userOnboardingEnabled = useFlag('userOnboardingEnabled');

  const { markTrainingActionAsComplete } =
    useUserOnboardingSliderMutationStore();

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

      if (userOnboardingEnabled) {
        const profileId = app?.user?.addresses?.[0]?.profile?.id;
        markTrainingActionAsComplete(
          UserTrainingCardTypes.GiveUpvote,
          // @ts-expect-error StrictNullChecks
          profileId,
        );
      }
    },
  });
};

export default useCreateThreadReactionMutation;
