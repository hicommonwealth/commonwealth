import React from 'react';

import 'components/component_kit/cw_tag.scss';
import { CWIcon } from './cw_icons/cw_icon';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

import { ComponentType } from './types';

type TagType =
  | 'passed'
  | 'failed'
  | 'active'
  | 'poll'
  | 'proposal'
  | 'referendum'
  | 'stage'
  | 'new';

export type TagProps = {
  iconName?: IconName;
  label: string;
  type?: TagType;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  trimAt?: number;
};

export const CWTag = ({ iconName, label, type, onClick, trimAt }: TagProps) => {
  const displayLabel = () => {
    if (!trimAt) {
      return label;
    }

    if (label?.length <= trimAt) {
      return label;
    }

    return label.slice(0, trimAt) + '...';
  };

  return (
    <div
      className={getClasses<{ type?: TagType }>({ type }, ComponentType.Tag)}
      onClick={onClick}
    >
      {!!iconName && (
        <CWIcon iconName={iconName} iconSize="small" className="tag-icon" />
      )}
      <CWText type="caption" fontWeight="medium" className="tag-text" noWrap>
        {displayLabel()}
      </CWText>
    </div>
  );
};
