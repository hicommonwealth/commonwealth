/* @jsx m */

import m from 'mithril';

import 'components/community_label.scss';

import { ChainInfo } from 'models';
import { CWText } from './component_kit/cw_text';
import { CWCommunityAvatar } from './component_kit/cw_community_avatar';
import { IconSize } from './component_kit/cw_icons/types';

type CommunityLabelAttrs = {
  community: ChainInfo;
  size?: IconSize;
};

export class CommunityLabel implements m.ClassComponent<CommunityLabelAttrs> {
  view(vnode) {
    const { community, size = 'small' } = vnode.attrs;

    return (
      <div class="CommunityLabel">
        <CWCommunityAvatar community={community} size={size} />
        <CWText noWrap type="b1" fontWeight="medium" title={community.name}>
          {community.name}
        </CWText>
      </div>
    );
  }
}
