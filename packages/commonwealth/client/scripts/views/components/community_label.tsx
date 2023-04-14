import 'components/community_label.scss';
import React from 'react';
import { CWCommunityAvatar } from './component_kit/cw_community_avatar';
import type { IconSize } from './component_kit/cw_icons/types';

import { CWText } from './component_kit/cw_text';

type CommunityLabelProps = {
  community: any;
  size?: IconSize;
};

export const CommunityLabel = (props: CommunityLabelProps) => {
  const { community, size = 'small' } = props;

  return (
    <div className="CommunityLabel">
      <CWCommunityAvatar community={community} size={size} />
      <CWText noWrap type="b1" fontWeight="medium" title={community.name}>
        {community.name}
      </CWText>
    </div>
  );
};
