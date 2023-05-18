import { useMutation, useQuery } from '@tanstack/react-query';
import app from 'state';
import axios from 'axios';
import Topic from 'models/Topic';
import { queryClient } from 'state/api/config';

interface CreateTopicProps {
  name: string;
  description: string;
  telegram?: string;
  featuredInSidebar: boolean;
  featuredInNewPost: boolean;
  tokenThreshold: string;
  defaultOffchainTemplate: string;
}

const createTopic = async ({
  name,
  description,
  telegram,
  featuredInSidebar,
  featuredInNewPost,
  tokenThreshold,
  defaultOffchainTemplate,
}: CreateTopicProps) => {
  const response = await axios.post(`${app.serverUrl()}/createTopic`, {
    name,
    description,
    telegram,
    featured_in_sidebar: featuredInSidebar,
    featured_in_new_post: featuredInNewPost,
    token_threshold: tokenThreshold || '0',
    default_offchain_template: defaultOffchainTemplate,
    jwt: app.user.jwt,
    chain: app.activeChainId(),
  });

  return new Topic(response.data);
};

export const useCreateTopicMutation = () => {
  return useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkTopics'] });
    },
  });
};

interface FetchTopicsProps {
  chainId: string;
}

const fetchTopics = async ({ chainId }: FetchTopicsProps) => {
  const response = await axios.get(`${app.serverUrl()}/bulkTopics`, {
    params: {
      chain: chainId || app.activeChainId(),
    },
  });

  return response.data.result.map((t) => new Topic(t));
};

export const useFetchTopicsQuery = ({ chainId }: FetchTopicsProps) => {
  return useQuery({
    queryKey: ['bulkTopics', chainId],
    queryFn: () => fetchTopics({ chainId }),
    staleTime: 1000,
  });
};

interface EditTopicProps {
  topic: Topic;
  featuredOrder?: number;
}

const editTopic = async ({ topic, featuredOrder }: EditTopicProps) => {
  const response = await axios.post(`${app.serverUrl()}/editTopic`, {
    id: topic.id,
    chain: topic.chainId,
    name: topic.name,
    description: topic.description,
    telegram: topic.telegram,
    featured_in_sidebar: topic.featuredInSidebar,
    featured_in_new_post: topic.featuredInNewPost,
    default_offchain_template: topic.defaultOffchainTemplate,
    featured_order: featuredOrder,
    address: app.user.activeAccount.address,
    jwt: app.user.jwt,
  });

  return new Topic(response.data);
};

export const useEditTopicMutation = () => {
  return useMutation({
    mutationFn: editTopic,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['bulkTopics', variables.topic.chainId],
      });
    },
  });
};
