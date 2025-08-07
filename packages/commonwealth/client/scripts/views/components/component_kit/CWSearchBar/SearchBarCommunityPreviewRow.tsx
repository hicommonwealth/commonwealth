import React, { FC } from 'react';
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

  return (
    <div className="SearchBarCommunityPreviewRow" onClick={handleClick}>
      <CommunityLabel
        name={searchResult.name || ''}
        iconUrl={searchResult.icon_url || ''}
      />
    </div>
  );
};
