/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_community_avatar.scss';

import { getClasses } from './helpers';
import { ComponentType } from './types';
import { IconSize } from './cw_icons/types';

type CommunityAvatarAttrs = {
  community: any;
  onclick?: () => void;
  size?: IconSize;
};

export class CWCommunityAvatar
  implements m.ClassComponent<CommunityAvatarAttrs>
{
  view(vnode) {
    const { community, onclick, size = 'large' } = vnode.attrs;

    return (
      <div
        class={getClasses<{ onclick: boolean; size: IconSize }>(
          { onclick: !!onclick, size },
          ComponentType.CommunityAvatar
        )}
        onclick={onclick}
      >
        {community.iconUrl ? (
          <img src={community.iconUrl} />
        ) : (
          <div class="no-image">
            <span>{community.name.slice(0, 1)}</span>
          </div>
        )}
      </div>
    );
  }
}
