import React from 'react';

import 'components/community_label.scss';
import { CWCommunityAvatar } from './component_kit/cw_community_avatar';
import type { IconSize } from './component_kit/cw_icons/types';

import { CWText } from './component_kit/cw_text';
import ChainInfo from 'client/scripts/models/ChainInfo';

type CommunityLabelProps = {
  community: ChainInfo;
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
