import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { userStore } from '../../ui/user';

interface EditCommunityTagsProps {
  communityId: string;
  selectedTags: { [tag: string]: boolean };
  tagIds?: number[];
}

const editCommunityTags = async ({
  communityId,
  selectedTags,
  tagIds,
}: EditCommunityTagsProps) => {
  const response = await axios.post(
    `${app.serverUrl()}/updateCommunityCategory`,
    {
      community_id: communityId,
      selected_tags: selectedTags,
      tag_ids: tagIds,
      auth: true,
      jwt: userStore.getState().jwt,
    },
  );

  return response.data.result;
};

const useEditCommunityTagsMutation = () => {
  return useMutation({
    mutationFn: editCommunityTags,
    onSuccess: async ({ tags, community_id }) => {
      // @ts-expect-error StrictNullChecks
      app.config.chainCategoryMap[community_id] = tags;
    },
  });
};

export default useEditCommunityTagsMutation;
