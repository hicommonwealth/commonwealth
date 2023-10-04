import './CommunityMembersPage.scss';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import app from 'state';
import { useDebounce } from 'usehooks-ts';
import { User } from 'views/components/user/user';
import {
  APIOrderBy,
  APIOrderDirection,
} from '../../../../helpers/constants';
import { useSearchProfilesQuery } from '../../../../state/api/profiles';
import { SearchProfilesResponse } from '../../../../state/api/profiles/searchProfiles';
import MinimumProfile from '../../../../models/MinimumProfile';
import { CWText } from '../../../components/component_kit/cw_text';
import { MembersSearchBar } from '../../../components/members_search_bar';

const MembersPage = () => {
  const containerRef = useRef<VirtuosoHandle>();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const { data, fetchNextPage } = useSearchProfilesQuery({
    chainId: app.activeChainId(),
    searchTerm: debouncedSearchTerm,
    limit: 10,
    orderBy: APIOrderBy.LastActive,
    orderDirection: APIOrderDirection.Desc,
    includeRoles: true,
  });

  const members = useMemo(() => {
    if (!data?.pages?.length) {
      return [];
    }
    return data.pages
      .reduce((acc, page) => {
        return [...acc, ...page.results];
      }, [] as SearchProfilesResponse['results'])
      .map((p) => ({
        id: p.id,
        address_id: p.addresses?.[0]?.id,
        address: p.addresses?.[0]?.address,
        address_chain: p.addresses?.[0]?.chain,
        chain: p.addresses?.[0]?.chain,
        profile_name: p.profile_name,
        avatar_url: p.avatar_url,
        roles: p.roles,
      }))
      .map((p) => {
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
  }, [data]);

  const totalResults = data?.pages?.[0]?.totalResults || 0;

  // fixes bug that prevents scrolling on initial page load
  useEffect(() => {
    const shouldFetchMore = members.length < 50 && totalResults > 50;
    if (!shouldFetchMore) {
      return;
    }
    fetchNextPage();
  }, [members, totalResults, fetchNextPage]);

  return (
    <div className="MembersPage">
      <CWText type="h3" fontWeight="medium">
        Members ({totalResults})
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
                userAddress={profileInfo.profile.address}
                userChainId={profileInfo.profile.chain}
                role={profileInfo.role}
                shouldShowRole
                shouldLinkProfile
              />
            </div>
          );
        }}
      />
    </div>
  );
};

export default MembersPage;
