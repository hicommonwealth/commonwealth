import React from 'react';

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
      <CWText noWrap type="b1" fontWeight="medium" title={name}>
        {name}
      </CWText>
    </div>
  );
};
