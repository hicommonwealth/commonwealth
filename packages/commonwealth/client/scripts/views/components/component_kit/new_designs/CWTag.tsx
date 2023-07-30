import React, { FC } from 'react';
import { X } from '@phosphor-icons/react';

import { CWCommunityAvatar } from '../cw_community_avatar';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';
import ChainInfo from 'client/scripts/models/ChainInfo';

import 'components/component_kit/new_designs/CWTag.scss';

type TagProps = {
  community: ChainInfo;
  disabled?: boolean;
  onClick: () => void;
};

export const CWTag: FC<TagProps> = ({ community, disabled, onClick }) => {
  const handleClick = () => {
    onClick();
  };

  return (
    <div className="CWTag">
      <div className="name">
        <CWCommunityAvatar size="small" community={community} />
        <CWText type="b2" fontWeight="regular">
          {community.name}
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
