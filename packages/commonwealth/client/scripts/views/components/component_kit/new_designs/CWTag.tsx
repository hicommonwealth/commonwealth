import React, { FC } from 'react';
import { X } from '@phosphor-icons/react';

import { CWCommunityAvatar } from '../cw_community_avatar';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';

import 'components/component_kit/new_designs/CWTag.scss';

type TagProps = {
  communityName: string;
  disabled?: boolean;
  onClick: () => void;
};

export const CWTag: FC<TagProps> = ({ communityName, disabled, onClick }) => {
  const handleClick = () => {
    onClick();
  };

  return (
    <div className="SearchBarTag">
      <div className="name">
        <CWCommunityAvatar size="small" community={null} />
        <CWText type="b2" fontWeight="regular">
          {communityName}
        </CWText>
      </div>
      <div
        className={getClasses({
          action: true,
          disabled,
        })}
        onClick={handleClick}
      >
        <X
          className={getClasses({ action: true }, ComponentType.Searchbar)}
          size={16}
        />
      </div>
    </div>
  );
};
