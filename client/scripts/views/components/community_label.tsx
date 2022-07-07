/* @jsx m */

import m from 'mithril';

import 'components/community_label.scss';

import { CWText } from './component_kit/cw_text';
import { CWCommunityAvatar } from './component_kit/cw_community_avatar';
import { IconSize } from './component_kit/cw_icons/types';

type CommunityLabelAttrs = {
  community: any;
  hasLink?: boolean;
  size?: IconSize;
};

export class CommunityLabel implements m.ClassComponent<CommunityLabelAttrs> {
  view(vnode) {
    const { community, hasLink, size = 'small' } = vnode.attrs;

    return (
      <div class="CommunityLabel">
        <CWCommunityAvatar
          community={community}
          onclick={hasLink ? () => m.route.set(`/${community.id}`) : null}
          size={size}
        />
        <CWText noWrap type="b1" fontWeight="medium" title={community.name}>
          {community.name}
        </CWText>
      </div>
    );
  }
}
