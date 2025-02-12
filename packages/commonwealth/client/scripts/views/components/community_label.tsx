import React from 'react';
import { handleMouseEnter, handleMouseLeave } from 'views/menus/utils';
import { CWTooltip } from '../components/component_kit/new_designs/CWTooltip';
import './community_label.scss';
import { CWCommunityAvatar } from './component_kit/cw_community_avatar';
import type { IconSize } from './component_kit/cw_icons/types';
import { CWText } from './component_kit/cw_text';

type CommunityLabelProps = {
  iconUrl: string;
  name: string;
  size?: IconSize;
};

export const CommunityLabel = ({
  name,
  iconUrl,
  size = 'small',
}: CommunityLabelProps) => {
  return (
    <div className="CommunityLabel">
      <CWCommunityAvatar
        community={{
          name,
          iconUrl,
        }}
        size={size}
      />
      <CWTooltip
        content={name && name.length > 17 ? name : null}
        placement="top"
        renderTrigger={(handleInteraction, isTooltipOpen) => (
          <CWText
            className="community-name"
            noWrap
            type="b1"
            fontWeight="medium"
            title={name}
            onMouseEnter={(e) => {
              handleMouseEnter({ e, isTooltipOpen, handleInteraction });
            }}
            onMouseLeave={(e) => {
              handleMouseLeave({ e, isTooltipOpen, handleInteraction });
            }}
          >
            {name}
          </CWText>
        )}
      />
    </div>
  );
};
