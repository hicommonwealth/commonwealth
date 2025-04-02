import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './ShowAddedCommunities.scss';

interface ShowAddedCommunitiesProps {
  selectedCommunities: string[];
  onRemoveCommunity: (community: string) => void;
}

const ShowAddedCommunities = ({
  selectedCommunities,
}: ShowAddedCommunitiesProps) => {
  if (!selectedCommunities?.length) return null;

  return (
    <div className="ShowAddedCommunities">
      <CWText>Added Communities</CWText>
      <div className="added-communities-container">
        {selectedCommunities.map((community) => (
          <CWTag key={community} label={community} type="filter" />
        ))}
      </div>
    </div>
  );
};

export default ShowAddedCommunities;
