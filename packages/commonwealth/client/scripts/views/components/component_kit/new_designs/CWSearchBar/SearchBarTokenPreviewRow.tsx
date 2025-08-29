import React, { FC } from 'react';
import { useCommonNavigate } from '../../../../../navigation/helpers';
import { TokenResult } from '../../../../pages/search/helpers';
import { CommunityLabel } from '../../../community_label';
import './SearchBarTokenPreviewRow.scss';

interface SearchBarTokenPreviewRowProps {
  searchResult: TokenResult;
  searchTerm?: string;
  onSearchItemClick?: () => void;
}

export const SearchBarTokenPreviewRow: FC<SearchBarTokenPreviewRowProps> = ({
  searchResult,
  onSearchItemClick,
}) => {
  const navigate = useCommonNavigate();

  const handleClick = () => {
    navigate('/', {}, searchResult.community_id);
    onSearchItemClick?.();
  };

  return (
    <div className="SearchBarTokenPreviewRow" onClick={handleClick}>
      <CommunityLabel
        name={searchResult.name || ''}
        iconUrl={searchResult.icon_url || ''}
      />
    </div>
  );
};
