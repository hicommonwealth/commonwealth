import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './ShowAddedTags.scss';

interface ShowAddedTagsProps {
  selectedTags: string[];
  onRemoveTag: (tag: string) => void;
}

const ShowAddedTags = ({ selectedTags }: ShowAddedTagsProps) => {
  if (!selectedTags?.length) return null;

  return (
    <div className="ShowAddedTags">
      <CWText>Added Tags</CWText>
      <div className="added-tags-container">
        {selectedTags.map((tag) => (
          <CWTag key={tag} label={tag} type="filter" />
        ))}
      </div>
    </div>
  );
};

export default ShowAddedTags;
