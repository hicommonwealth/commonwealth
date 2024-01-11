import React, { FC } from 'react';

import { useCommonNavigate } from '../../../../../navigation/helpers';
import { MemberResult } from '../../../../pages/search/helpers';
import { User } from '../../../user/user';

import './SearchBarMemberPreviewRow.scss';

interface SearchBarMemberPreviewRowProps {
  searchResult: MemberResult;
  searchTerm?: string;
}

export const SearchBarMemberPreviewRow: FC<SearchBarMemberPreviewRowProps> = ({
  searchResult,
}) => {
  const community = searchResult.addresses[0].chain;
  const address = searchResult.addresses[0].address;

  const navigate = useCommonNavigate();

  const handleClick = () => {
    navigate(`/profile/id/${searchResult.id}`, {}, null);
  };

  return (
    <div className="SearchBarMemberPreviewRow" onClick={handleClick}>
      <User
        userAddress={address}
        userCommunityId={community}
        shouldLinkProfile
      />
    </div>
  );
};
