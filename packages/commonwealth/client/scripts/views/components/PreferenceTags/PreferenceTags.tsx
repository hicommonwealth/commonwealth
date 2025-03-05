import clsx from 'clsx';
import React from 'react';
import { CWButton } from '../component_kit/new_designs/CWButton';
import './PreferenceTags.scss';
import { ICONS } from './config';
import { PreferenceTagsProps } from './types';

const PreferenceTags = ({
  preferenceTags,
  onTagClick,
  containerClassName,
  maxSelectableTags,
}: PreferenceTagsProps) => {
  return (
    <div className={clsx('PreferenceTags', containerClassName)}>
      {preferenceTags.map(({ item, isSelected }) => {
        const label = `${ICONS[item.tag] || '?'}  ${item.tag}`;
        return (
          <CWButton
            key={`${item.id}-${isSelected}`}
            label={label}
            type="button"
            buttonWidth="narrow"
            buttonType={isSelected ? 'primary' : 'secondary'}
            containerClassName={clsx('tag', { isSelected })}
            onClick={() => onTagClick(item, !isSelected)}
            disabled={
              isSelected
                ? false
                : maxSelectableTags ===
                  preferenceTags.filter((t) => t.isSelected).length
            }
            buttonHeight="sm"
          />
        );
      })}
    </div>
  );
};

export default PreferenceTags;
