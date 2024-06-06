import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useFlag } from 'hooks/useFlag';
import Comment from 'models/Comment';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { UserTrainingCardTypes } from 'views/components/UserTrainingSlider/types';
import { UserProfile } from '../../../models/MinimumProfile';
import { updateThreadInAllCaches } from '../threads/helpers/cache';
import useFetchCommentsQuery from './fetchComments';

interface CreateCommentProps {
  profile: UserProfile;
  threadId: number;
  communityId: string;
  unescapedText: string;
  parentCommentId: number;
  existingNumberOfComments: number;
}

const createComment = async ({
  communityId,
  profile,
  threadId,
  unescapedText,
  // @ts-expect-error StrictNullChecks
  parentCommentId = null,
}: CreateCommentProps) => {
  const {
    session = null,
    action = null,
    hash = null,
  } = await app.sessions.signComment(profile.address, {
    thread_id: threadId,
    body: unescapedText,
    parent_comment_id: parentCommentId,
  });

  const response = await axios.post(
    `${app.serverUrl()}/threads/${threadId}/comments`,
    {
      author_community_id: communityId,
      community_id: communityId,
      address: profile.address,
      parent_id: parentCommentId,
      text: encodeURIComponent(unescapedText),
      jwt: app.user.jwt,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    },
  );

  response.data.result.Address.User = {
    Profiles: [profile],
  };

  return new Comment(response.data.result);
};

const useCreateCommentMutation = ({
  communityId,
  threadId,
  existingNumberOfComments = 0,
}: Partial<CreateCommentProps>) => {
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
    mutationFn: createComment,
    onSuccess: async (newComment) => {
      // update fetch comments query state
      const key = [ApiEndpoints.FETCH_COMMENTS, communityId, threadId];
      queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData(key, () => {
        return [...comments, newComment];
      });
      // @ts-expect-error StrictNullChecks
      updateThreadInAllCaches(communityId, threadId, {
        numberOfComments: existingNumberOfComments + 1,
      });
      updateThreadInAllCaches(
        // @ts-expect-error StrictNullChecks
        communityId,
        threadId,
        { recentComments: [newComment] },
        'combineAndRemoveDups',
      );

      if (userOnboardingEnabled) {
        const profileId = app?.user?.addresses?.[0]?.profile?.id;
        markTrainingActionAsComplete(
          UserTrainingCardTypes.CreateContent,
          // @ts-expect-error StrictNullChecks
          profileId,
        );
      }

      return newComment;
    },
  });
};

export default useCreateCommentMutation;
