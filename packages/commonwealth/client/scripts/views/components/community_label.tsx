/* @jsx jsx */
import React from 'react';

import type { ResultNode} from 'mithrilInterop';
import { ClassComponent, jsx } from 'mithrilInterop';

import 'components/community_label.scss';
import { CWCommunityAvatar } from './component_kit/cw_community_avatar';
import type { IconSize } from './component_kit/cw_icons/types';

import { CWText } from './component_kit/cw_text';

type CommunityLabelAttrs = {
  community: any;
  size?: IconSize;
};

export class CommunityLabel extends ClassComponent<CommunityLabelAttrs> {
  view(vnode: ResultNode<CommunityLabelAttrs>) {
    const { community, size = 'small' } = vnode.attrs;

    return (
      <div className="CommunityLabel">
        <CWCommunityAvatar community={community} size={size} />
        <CWText noWrap type="b1" fontWeight="medium" title={community.name}>
          {community.name}
        </CWText>
      </div>
    );
  }
}
