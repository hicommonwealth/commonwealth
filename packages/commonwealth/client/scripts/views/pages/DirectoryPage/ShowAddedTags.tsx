import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import './ShowAddedTags.scss';

interface ShowAddedTagsProps {
  selectedTags: string[];
  isLoading: boolean;
}

const ShowAddedTags = ({ selectedTags, isLoading }: ShowAddedTagsProps) => {
  if (isLoading) {
    return <CWCircleMultiplySpinner />;
  }

  if (!selectedTags?.length) {
    return null;
  }

  return (
    <div className="ShowAddedTags">
      <CWText>Added Tags by Admin</CWText>
      <div className="added-tags-container">
        {selectedTags.map((tag) => (
          <CWTag classNames="tag-button" key={tag} label={tag} type="filter" />
        ))}
      </div>
    </div>
  );
};

export default ShowAddedTags;
