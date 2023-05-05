import React, { useState } from 'react';
import { Topic } from 'models';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import $ from 'jquery';
import app from 'state';
import queryKeys from './queryKeys';

const useTopics = () => {
  // auth state to come from zustand, localstorage is just for demo purposes
  const JWT = localStorage.getItem('jwt');

  const queryClient = useQueryClient();
  const [topicsForChainId, setTopicsForChainId] = useState<string>();

  const fetchTopicsQuery = useQuery({
    queryKey: [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
    queryFn: async () => {
      return queryClient.getQueryData([
        queryKeys.TOPICS_FOR_CHAIN(topicsForChainId),
      ]);
    },
    enabled: !!topicsForChainId,
    staleTime: 60_000, // cache for 60 seconds
  });

  const addTopicQuery = useMutation({
    onMutate: async ({
      name,
      description,
      telegram,
      featuredInSidebar,
      featuredInNewPost,
      tokenThreshold,
      defaultOffchainTemplate,
    }: {
      name: string;
      description: string;
      telegram: string;
      featuredInSidebar: boolean;
      featuredInNewPost: boolean;
      tokenThreshold: string;
      defaultOffchainTemplate: string;
    }) => {
      // Cancel any outgoing refetches ,(so they don't overwrite
      // our optimistic update)
      await queryClient.cancelQueries({
        queryKey: [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
      });

      // fetch old topics from react query store
      const oldTopics = queryClient.getQueryData([
        queryKeys.TOPICS_FOR_CHAIN(topicsForChainId),
      ]);

      // update optimistic value
      queryClient.setQueryData(
        [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
        (t: Topic[]) => {
          const updatedTopics = [...t];

          const newTopic = new Topic({
            id: -1, // -1 to indicate a new thread
            name,
            description,
            telegram,
            featured_in_new_post: featuredInNewPost,
            featured_in_sidebar: featuredInSidebar,
            token_threshold: tokenThreshold,
            default_offchain_template: defaultOffchainTemplate,
          });

          return [...updatedTopics, newTopic];
        }
      );

      return { oldTopics };
    },
    mutationFn: async ({
      name,
      description,
      telegram,
      featuredInSidebar,
      featuredInNewPost,
      tokenThreshold,
      defaultOffchainTemplate,
    }: {
      name: string;
      description: string;
      telegram: string;
      featuredInSidebar: boolean;
      featuredInNewPost: boolean;
      tokenThreshold: string;
      defaultOffchainTemplate: string;
    }) => {
      const response = await $.post(`${app.serverUrl()}/createTopic`, {
        chain: app.activeChainId(),
        name,
        description,
        telegram,
        featured_in_sidebar: featuredInSidebar,
        featured_in_new_post: featuredInNewPost,
        default_offchain_template: defaultOffchainTemplate,
        token_threshold: tokenThreshold,
        jwt: JWT,
      });

      const result = new Topic(response.result);

      // update proper value
      queryClient.setQueryData(
        [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
        (t: Topic[]) => {
          const foundIndex = t.findIndex((x) => x.id === -1);

          t[foundIndex] = new Topic({
            ...t[foundIndex],
            ...response.result,
          });

          return [...t];
        }
      );

      return result;
    },
    onError: (err: any, originalPayload, context) => {
      // revert optimistic change
      queryClient.setQueryData(
        [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
        (t: Topic[]) => {
          return context.oldTopics;
        }
      );

      return err.responseJSON && err.responseJSON.error
        ? err.responseJSON.error
        : 'Failed to add topic';
    },
  });

  const editTopicByIdQuery = useMutation({
    onMutate: async ({
      topic,
      address,
      featuredOrder,
    }: {
      topic: Topic;
      address: string;
      featuredOrder?: number;
    }) => {
      // Cancel any outgoing refetches ,(so they don't overwrite
      // our optimistic update)
      await queryClient.cancelQueries({
        queryKey: [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
      });

      // fetch old topics from react query store
      const oldTopics = queryClient.getQueryData([
        queryKeys.TOPICS_FOR_CHAIN(topicsForChainId),
      ]);

      // update optimistic value
      queryClient.setQueryData(
        [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
        (t: Topic[]) => {
          const updatedTopics = [...t];

          const foundIndex = updatedTopics.findIndex((x) => x.id === topic.id);

          updatedTopics[foundIndex] = new Topic({
            ...updatedTopics[foundIndex],
            ...topic,
          });

          return [...updatedTopics];
        }
      );

      return { oldTopics };
    },
    mutationFn: async ({
      topic,
      address,
      featuredOrder,
    }: {
      topic: Topic;
      address: string;
      featuredOrder?: number;
    }) => {
      const response = await $.post(`${app.serverUrl()}/editTopic`, {
        id: topic.id,
        chain: topic.chainId,
        name: topic.name,
        description: topic.description,
        telegram: topic.telegram,
        featured_in_sidebar: topic.featuredInSidebar,
        featured_in_new_post: topic.featuredInNewPost,
        default_offchain_template: topic.defaultOffchainTemplate,
        featured_order: featuredOrder,
        address: address,
        jwt: JWT,
      });

      const result = new Topic(response.result);

      // update proper value
      queryClient.setQueryData(
        [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
        (t: Topic[]) => {
          const foundIndex = t.findIndex((x) => x.id === topic.id);

          t[foundIndex] = new Topic({
            ...t[foundIndex],
            ...response.result,
          });

          return [...t];
        }
      );

      return result;
    },
    onError: (err: any, originalPayload, context) => {
      // revert optimistic change
      queryClient.setQueryData(
        [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
        (t: Topic[]) => {
          return context.oldTopics;
        }
      );

      return err.responseJSON && err.responseJSON.error
        ? err.responseJSON.error
        : 'Failed to edit topic';
    },
  });

  const removeTopicByIdQuery = useMutation({
    onMutate: async ({ id, chainId }: { id: number; chainId: string }) => {
      // Cancel any outgoing refetches ,(so they don't overwrite
      // our optimistic update)
      await queryClient.cancelQueries({
        queryKey: [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
      });

      // fetch old topics from react query store
      const oldTopics = queryClient.getQueryData([
        queryKeys.TOPICS_FOR_CHAIN(topicsForChainId),
      ]);

      // update optimistic value
      queryClient.setQueryData(
        [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
        (t: Topic[]) => {
          return [...t].filter((x) => x.id !== id);
        }
      );

      return { oldTopics };
    },
    mutationFn: async ({ id, chainId }: { id: number; chainId: string }) => {
      await $.post(`${app.serverUrl()}/deleteTopic`, {
        id: id,
        chain: chainId,
        jwt: JWT,
      });
    },
    onError: (err: any, originalPayload, context) => {
      // revert optimistic change
      queryClient.setQueryData(
        [queryKeys.TOPICS_FOR_CHAIN(topicsForChainId)],
        (t: Topic[]) => {
          return context.oldTopics;
        }
      );

      return err.responseJSON && err.responseJSON.error
        ? err.responseJSON.error
        : 'Failed to remove topic';
    },
  });

  return {
    fetchTopicsQuery: {
      ...fetchTopicsQuery,
      fetchTopicsForChainId: (chainId: string) => setTopicsForChainId(chainId),
    },
    editTopicByIdQuery,
    addTopicQuery,
    removeTopicByIdQuery,
  };
};

export default useTopics;
