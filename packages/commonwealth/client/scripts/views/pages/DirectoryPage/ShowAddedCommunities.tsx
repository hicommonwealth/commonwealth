import React from 'react';
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
      {selectedCommunities.map((community) => (
        <CWTag key={community} label={community} type="filter" />
      ))}
    </div>
  );
};

export default ShowAddedCommunities;
