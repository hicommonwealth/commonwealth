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
  | 'new';

export type TagProps = {
  iconName?: IconName;
  label: string;
  type?: TagType;
};

export const CWTag = (props: TagProps) => {
  const { iconName, label, type } = props;

  return (
    <div
      className={getClasses<{ type?: TagType }>({ type }, ComponentType.Tag)}
    >
      {!!iconName && (
        <CWIcon iconName={iconName} iconSize="small" className="tag-icon" />
      )}
      <CWText type="caption" fontWeight="medium" className="tag-text" noWrap>
        {label}
      </CWText>
    </div>
  );
};
