import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { userStore } from '../../ui/user';
import { ApiEndpoints, queryClient } from '../config';
import { FetchActiveCommunitiesResponse } from './fetchActiveCommunities';

interface EditCommunityTagsProps {
  communityId: string;
  tagIds?: number[];
}

const editCommunityTags = async ({
  communityId,
  tagIds,
}: EditCommunityTagsProps) => {
  const response = await axios.post(
    `${app.serverUrl()}/updateCommunityCategory`,
    {
      community_id: communityId,
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
    onSuccess: ({ CommunityTags = [], community_id }) => {
      const community = app.config.chains.getById(community_id);
      if (community) community.updateTags(CommunityTags);

      // update active communities cache
      const key = [ApiEndpoints.FETCH_ACTIVE_COMMUNITIES];
      const existingActiveCommunities:
        | FetchActiveCommunitiesResponse
        | undefined = queryClient.getQueryData(key);
      if (existingActiveCommunities) {
        const foundCommunity = existingActiveCommunities.communities.find(
          (c) => c.id === community_id,
        );
        if (foundCommunity) {
          foundCommunity.CommunityTags = CommunityTags;
          queryClient.setQueryData(key, () => existingActiveCommunities);
        }
      }
    },
  });
};

export default useEditCommunityTagsMutation;
