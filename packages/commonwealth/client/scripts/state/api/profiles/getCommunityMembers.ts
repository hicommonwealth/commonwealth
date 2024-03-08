import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  APIOrderBy,
  APIOrderDirection,
} from 'client/scripts/helpers/constants';
import { MemberResult } from 'client/scripts/views/pages/search/helpers';
import app from 'state';
import { ApiEndpoints } from '../config';

const SEARCH_PROFILES_STALE_TIME = 60 * 1_000; // 60 s

export type GetCommunityMembersResponse = {
  results: MemberResult[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

interface GetCommunityMembersProps {
  communityId: string;
  searchTerm: string;
  limit: number;
  orderBy: APIOrderBy;
  orderDirection: APIOrderDirection;
  includeRoles: boolean;
  includeMembershipTypes?: 'in-group' | `in-group:${string}` | 'not-in-group';
  includeGroupIds?: boolean;
  includeStakeBalances?: boolean;
  enabled?: boolean;
}

const getCommunityMembers = async ({
  pageParam = 1,
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  includeMembershipTypes,
  includeGroupIds,
  includeRoles,
  includeStakeBalances,
}: GetCommunityMembersProps & { pageParam: number }) => {
  const {
    data: { result },
  } = await axios.get<{ result: GetCommunityMembersResponse }>(
    `${app.serverUrl()}/members`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        community_id: communityId,
        search: searchTerm,
        limit: limit.toString(),
        page: pageParam.toString(),
        order_by: orderBy,
        order_direction: orderDirection,
        include_roles: includeRoles,
        ...(includeMembershipTypes && { memberships: includeMembershipTypes }),
        ...(includeGroupIds && { include_group_ids: includeGroupIds }),
        ...(includeStakeBalances && {
          include_stake_balances: includeStakeBalances,
        }),
      },
    },
  );
  return result;
};

const useGetCommunityMembersQuery = ({
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  includeRoles,
  includeGroupIds,
  includeMembershipTypes,
  includeStakeBalances,
  enabled = true,
}: GetCommunityMembersProps) => {
  const key = [
    ApiEndpoints.getCommunityMembers(searchTerm),
    {
      communityId,
      orderBy,
      orderDirection,
      includeRoles,
      includeGroupIds,
      includeMembershipTypes,
    },
  ];
  return useInfiniteQuery(
    key,
    ({ pageParam }) =>
      getCommunityMembers({
        pageParam,
        communityId,
        searchTerm,
        limit,
        orderBy,
        orderDirection,
        includeMembershipTypes,
        includeGroupIds,
        includeStakeBalances,
        includeRoles,
      }),
    {
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
      staleTime: SEARCH_PROFILES_STALE_TIME,
      enabled,
    },
  );
};

export default useGetCommunityMembersQuery;
