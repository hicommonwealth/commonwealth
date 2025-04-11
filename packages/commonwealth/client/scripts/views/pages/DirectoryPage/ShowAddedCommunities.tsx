import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import './ShowAddedCommunities.scss';

interface ShowAddedCommunitiesProps {
  selectedCommunities: string[];
  isLoading: boolean;
}

const ShowAddedCommunities = ({
  selectedCommunities,
  isLoading,
}: ShowAddedCommunitiesProps) => {
  if (isLoading) {
    return <CWCircleMultiplySpinner />;
  }

  if (!selectedCommunities?.length) {
    return null;
  }

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
