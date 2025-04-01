import React from 'react';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './ShowAddedTags.scss';

interface ShowAddedTagsProps {
  selectedTags: string[];
  onRemoveTag: (tag: string) => void;
}

const ShowAddedTags = ({ selectedTags, onRemoveTag }: ShowAddedTagsProps) => {
  if (!selectedTags?.length) return null;

  return (
    <div className="ShowAddedTags">
      {selectedTags.map((tag) => (
        <CWTag key={tag} label={tag} type="filter" />
      ))}
    </div>
  );
};

export default ShowAddedTags;
