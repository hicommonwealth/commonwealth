import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';
import { invalidateAllQueriesForCommunity } from './getCommuityById';

interface EditCommunityTagsProps {
  communityId: string;
  tagIds?: number[];
}

const editCommunityTags = async ({
  communityId,
  tagIds,
}: EditCommunityTagsProps) => {
  const response = await axios.post(`${SERVER_URL}/updateCommunityCategory`, {
    community_id: communityId,
    tag_ids: tagIds,
    auth: true,
    jwt: userStore.getState().jwt,
  });

  return response.data.result;
};

const useEditCommunityTagsMutation = () => {
  return useMutation({
    mutationFn: editCommunityTags,
    onSuccess: async ({ community_id }) => {
      await invalidateAllQueriesForCommunity(community_id);
    },
  });
};

export default useEditCommunityTagsMutation;
