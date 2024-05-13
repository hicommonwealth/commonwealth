import clsx from 'clsx';
import React from 'react';
import { CWButton } from '../component_kit/new_designs/CWButton';
import './PreferenceTags.scss';
import { PreferenceTagsProps } from './types';

const PreferenceTags = ({
  selectedTags,
  onTagClick,
  containerClassName,
  maxSelectableTags,
}: PreferenceTagsProps) => {
  return (
    <div className={clsx('PreferenceTags', containerClassName)}>
      {selectedTags.map(({ item, isSelected }) => (
        <CWButton
          key={`${item.id}-${isSelected}`}
          label={item.tag}
          type="button"
          buttonWidth="narrow"
          buttonType={isSelected ? 'primary' : 'secondary'}
          containerClassName={clsx('tag', { isSelected })}
          onClick={() => onTagClick(item, !isSelected)}
          disabled={
            maxSelectableTags === selectedTags.length &&
            !!selectedTags.find(
              (selectedTag) => selectedTag.item.tag === item.tag,
            )
          }
          buttonHeight="sm"
        />
      ))}
    </div>
  );
};

export default PreferenceTags;
