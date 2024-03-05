import React, { FC } from 'react';

import ChainInfo from '../../../../../models/ChainInfo';
import { useCommonNavigate } from '../../../../../navigation/helpers';
import { CommunityResult } from '../../../../pages/search/helpers';
import { CommunityLabel } from '../../../community_label';

import './SearchBarCommunityPreviewRow.scss';

interface SearchBarCommunityPreviewRowProps {
  searchResult: CommunityResult;
  searchTerm?: string;
  onSearchItemClick?: () => void;
}

export const SearchBarCommunityPreviewRow: FC<
  SearchBarCommunityPreviewRowProps
> = ({ searchResult, onSearchItemClick }) => {
  const navigate = useCommonNavigate();

  const handleClick = () => {
    navigate(`/${searchResult.id}`, {}, null);
    onSearchItemClick?.();
  };

  const communityInfo = ChainInfo.fromJSON(searchResult as any);

  return (
    <div className="SearchBarCommunityPreviewRow" onClick={handleClick}>
      <CommunityLabel community={communityInfo} />
    </div>
  );
};
