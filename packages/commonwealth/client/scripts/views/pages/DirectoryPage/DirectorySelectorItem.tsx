import React from 'react';
import { CWAvatar } from 'views/components/component_kit/cw_avatar';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import './DirectorySelectorItem.scss';

type DirectorySelectorItemProps = {
  tagOrCommunityName: string;
  communityIcon?: string;
  isSelected?: boolean;
  onChange?: () => void;
};

const DirectorySelectorItem = ({
  tagOrCommunityName,
  communityIcon,
  isSelected,
  onChange,
}: DirectorySelectorItemProps) => {
  return (
    <div className={`DirectorySelectorItem ${isSelected ? 'selected' : ''}`}>
      <div className="body">
        <CWCheckbox checked={isSelected} onChange={onChange} />
        {communityIcon && (
          <div className="community-avatar">
            <CWAvatar avatarUrl={communityIcon} size={24} />
          </div>
        )}
        <CWText>{tagOrCommunityName}</CWText>
      </div>
    </div>
  );
};

export default DirectorySelectorItem;
