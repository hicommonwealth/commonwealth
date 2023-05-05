import React, { useState } from 'react';
import { Topic } from 'models';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import $ from 'jquery';
import app from 'state';
import queryKeys from './queryKeys';

const useChains = () => {
  // auth state to come from zustand, localstorage is just for demo purposes
  const JWT = localStorage.getItem('jwt');

  const queryClient = useQueryClient();
  const [chainIdToFetch, setChainIdToFetch] = useState<string>();

  const fetchBulkOffChainQuery = useQuery({
    queryKey: [queryKeys.BULK_OFFCHAIN(chainIdToFetch)],
    queryFn: async () => {
      // api call
      const [response] = await Promise.all([
        $.get(`${app.serverUrl()}/bulkOffchain`, {
          community: null,
          chain: chainIdToFetch,
          jwt: JWT,
        }),
      ]);

      // process payload
      const { topics } = response.result;

      // set topics state (changes are propogated to all components that use the useTopics hook)
      await queryClient.cancelQueries({
        queryKey: [queryKeys.TOPICS_FOR_CHAIN(chainIdToFetch)],
      });
      queryClient.setQueryData(
        [queryKeys.TOPICS_FOR_CHAIN(chainIdToFetch)],
        (t: []) => [...(t || []), ...topics].map((x) => new Topic(x))
      );

      // return cached response
      return response;
    },
    enabled: !!chainIdToFetch,
    staleTime: 60_000, // cache for 60 seconds, then auto refetch
  });

  return {
    fetchBulkOffChainQuery: {
      ...fetchBulkOffChainQuery,
      fetchChainById: (chainId: string) => setChainIdToFetch(chainId),
    },
  };
};

export default useChains;
