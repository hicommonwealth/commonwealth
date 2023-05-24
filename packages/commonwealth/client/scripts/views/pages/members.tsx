import React, { useEffect, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import 'pages/members.scss';

import app from 'state';
import MinimumProfile from '../../models/MinimumProfile';
import { User } from 'views/components/user/user';
import Sublayout from 'views/Sublayout';
import { CWText } from '../components/component_kit/cw_text';
import { AccessLevel } from 'permissions';
import { useDebounce } from 'usehooks-ts';
import { MembersSearchBar } from '../components/members_search_bar';

type MemberInfo = {
  profile: MinimumProfile;
  role: any;
};

const MembersPage = () => {
  const containerRef = useRef<VirtuosoHandle>();

  const [membersList, setMembersList] = React.useState<Array<MemberInfo>>([]);
  const [totalCount, setTotalCount] = useState<number>(1);
  const [page, setPage] = useState<number>(1);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const handleLoadNextPage = async (searchQuery: string, reset: boolean) => {
    const newPage = reset ? 1 : page + 1;
    setPage(newPage);

    const response = await app.search.searchMentionableProfiles(
      searchQuery || '',
      app.activeChainId(),
      50,
      newPage,
      true
    );

    if (response.totalCount) {
      setTotalCount(response.totalCount);
    }

    const members = response.profiles.map((p) => ({
      id: p.id,
      address_id: p.addresses?.[0]?.id,
      address: p.addresses?.[0]?.address,
      address_chain: p.addresses?.[0]?.chain,
      chain_id: p.addresses?.[0]?.chain,
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

    if (reset) {
      setMembersList(profiles);
      if (containerRef) {
        containerRef.current.scrollToIndex(0);
      }
    } else {
      setMembersList([...membersList, ...profiles]);
    }
  };

  // on debounced search term change, refresh search results
  useEffect(() => {
    if (debouncedSearchTerm === '') {
      handleLoadNextPage('', true);
      return;
    }
    if (debouncedSearchTerm.length >= 3) {
      handleLoadNextPage(debouncedSearchTerm, true);
    }
  }, [debouncedSearchTerm]);

  // on init, load first page
  useEffect(() => {
    handleLoadNextPage('', true);
  }, []);

  return (
    <Sublayout>
      <div className="MembersPage">
        <CWText type="h3" fontWeight="medium">
          Members ({totalCount})
        </CWText>
        <MembersSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          chainName={app.activeChainId()}
        />
        <Virtuoso
          ref={containerRef}
          data={membersList}
          endReached={() => handleLoadNextPage(searchTerm, false)}
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
    </Sublayout>
  );
};

export default MembersPage;
