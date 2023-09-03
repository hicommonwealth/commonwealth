import React, { FC } from 'react';

import { CommunityResult } from '../../../../../views/pages/search/helpers';
import { useCommonNavigate } from '../../../../../navigation/helpers';
import ChainInfo from '../../../../../models/ChainInfo';
import { CommunityLabel } from '../../../community_label';

import './SearchBarCommunityPreviewRow.scss';

interface SearchBarCommunityPreviewRowProps {
  searchResult: CommunityResult;
  searchTerm?: string;
}

export const SearchBarCommunityPreviewRow: FC<
  SearchBarCommunityPreviewRowProps
> = ({ searchResult }) => {
  const navigate = useCommonNavigate();

  const handleClick = () => {
    navigate(`/${searchResult.id}`, {}, null);
  };

  const chainInfo = ChainInfo.fromJSON(searchResult as any);

  return (
    <div className="SearchBarCommunityPreviewRow" onClick={handleClick}>
      <CommunityLabel community={chainInfo} />
    </div>
  );
};
