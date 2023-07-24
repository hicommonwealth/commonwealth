import 'pages/members.scss';
import React, { useEffect, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import app from 'state';
import { useDebounce } from 'usehooks-ts';
import { User } from 'views/components/user/user';
import MinimumProfile from '../../models/MinimumProfile';
import { CWText } from '../components/component_kit/cw_text';
import { MembersSearchBar } from '../components/members_search_bar';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

const MIN_SEARCH_TERM_LENGTH = 1;

type MemberInfo = {
  profile: MinimumProfile;
  role: any;
};
type ProfilesSearchResponse = {
  results: {
    id: number;
    user_id: string;
    profile_name: string;
    avatar_url: string;
    addresses: {
      id: number;
      chain: string;
      address: string;
    }[];
    roles?: any[];
  }[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

const orderBy = 'last_active';
const orderDirection = 'DESC';

const MembersPage = () => {
  const containerRef = useRef<VirtuosoHandle>();
  const chain = app.activeChainId();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const fetchSearchResults = async ({ pageParam = 0 }) => {
    const urlParams = {
      chain,
      search: debouncedSearchTerm,
      limit: (10).toString(),
      page: pageParam.toString(),
      order_by: orderBy,
      order_direction: orderDirection,
      include_roles: 'true',
    };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(urlParams)) {
      q.set(k, v);
    }
    const {
      data: { result },
    } = await axios.get<{ result: ProfilesSearchResponse }>(
      `/api/profiles?${q.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const members = result.results.map((p) => ({
      id: p.id,
      address_id: p.addresses?.[0]?.id,
      address: p.addresses?.[0]?.address,
      address_chain: p.addresses?.[0]?.chain,
      chain: p.addresses?.[0]?.chain,
      profile_name: p.profile_name,
      avatar_url: p.avatar_url,
      roles: p.roles,
    }));

    const profiles: Array<MemberInfo> = members.map((p) => {
      const minProfile = new MinimumProfile(p.address, p.chain);
      minProfile.initialize(
        p.profile_name,
        p.address,
        p.avatar_url,
        p.id,
        p.chain,
        null
      );
      return {
        profile: minProfile,
        role: p.roles.find(
          (role) =>
            role.chain_id === app.activeChainId() &&
            ['admin', 'moderator'].includes(role.permission)
        ),
      };
    });

    return { ...result, results: profiles };
  };

  const { data, fetchNextPage, refetch } = useInfiniteQuery(
    [
      'search-members',
      {
        debouncedSearchTerm,
        chain: app.activeChainId(),
        orderBy,
        orderDirection,
      },
    ],
    fetchSearchResults,
    {
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
    }
  );

  // on debounced search term change, refresh search results
  useEffect(() => {
    if (debouncedSearchTerm.length < MIN_SEARCH_TERM_LENGTH) {
      return;
    }
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  // on data change, scroll to top
  useEffect(() => {
    containerRef.current.scrollToIndex(0);
  }, [data]);

  const members =
    data?.pages.reduce((acc, page) => [...acc, ...page.results], []) || [];

  return (
    <div className="MembersPage">
      <CWText type="h3" fontWeight="medium">
        Members ({data?.pages?.[0]?.totalResults || 0})
      </CWText>
      <MembersSearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        chainName={app.activeChainId()}
      />
      <Virtuoso
        ref={containerRef}
        data={members}
        endReached={() => fetchNextPage()}
        itemContent={(index, profileInfo) => {
          return (
            <div className="member-row" key={index}>
              <User
                user={profileInfo.profile}
                role={profileInfo.role}
                showRole
                hideAvatar={false}
                linkify
              />
            </div>
          );
        }}
      />
    </div>
  );
};

export default MembersPage;
