import React from 'react';
import { CWAvatar } from 'views/components/component_kit/cw_avatar';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import './DirectorySelectorItem.scss';

type DirectorySelectorItemProps = {
  tagOrCommunityName: string;
  communityIcon?: string;
};

const DirectorySelectorItem = ({
  tagOrCommunityName,
  communityIcon,
}: DirectorySelectorItemProps) => {
  return (
    <div
      className="DirectorySelectorItem"
      onClick={() => {
        console.log('hello from DirectorySelectorItem');
      }}
    >
      <div className="body">
        <CWCheckbox />
        {communityIcon && <CWAvatar avatarUrl={communityIcon} size={24} />}
        <CWText>{tagOrCommunityName}</CWText>
      </div>
    </div>
  );
};

export default DirectorySelectorItem;
