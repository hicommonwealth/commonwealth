import React, { FC } from 'react';

import { CommunityMember } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { useCommonNavigate } from '../../../../../navigation/helpers';
import { User } from '../../../user/user';

import './SearchBarMemberPreviewRow.scss';

interface SearchBarMemberPreviewRowProps {
  searchResult: z.infer<typeof CommunityMember>;
  searchTerm?: string;
  onSearchItemClick?: () => void;
}

export const SearchBarMemberPreviewRow: FC<SearchBarMemberPreviewRowProps> = ({
  searchResult,
  onSearchItemClick,
}) => {
  const community_id = searchResult.addresses[0].community_id;
  const address = searchResult.addresses[0].address;

  const navigate = useCommonNavigate();

  const handleClick = () => {
    navigate(
      `/profile/id/${searchResult.addresses.at(0)?.profile_id}`,
      {},
      null,
    );
    onSearchItemClick?.();
  };

  return (
    <div className="SearchBarMemberPreviewRow" onClick={handleClick}>
      <User
        userAddress={address}
        userCommunityId={community_id}
        shouldShowAsDeleted={!address && !community_id}
        shouldLinkProfile
      />
    </div>
  );
};
