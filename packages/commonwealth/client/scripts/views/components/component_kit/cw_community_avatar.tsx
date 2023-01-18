/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_community_avatar.scss';
import m from 'mithril';

import type { ChainInfo } from 'models';
import type { IconSize } from './cw_icons/types';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import { ComponentType } from './types';

type CommunityAvatarAttrs = {
  community: ChainInfo;
  onclick?: () => void;
  size?: IconSize;
};

export class CWCommunityAvatar extends ClassComponent<CommunityAvatarAttrs> {
  view(vnode: m.Vnode<CommunityAvatarAttrs>) {
    const { community, onclick, size = 'large' } = vnode.attrs;

    const sizeIsAboveLarge =
      size !== 'small' && size !== 'medium' && size !== 'large';

    return (
      <div
        class={getClasses<{ onclick: boolean; size: IconSize }>(
          { onclick: !!onclick, size },
          ComponentType.CommunityAvatar
        )}
        onclick={onclick}
      >
        {community.iconUrl ? (
          <img class="community-image" src={community.iconUrl} />
        ) : (
          <div class={getClasses<{ size: IconSize }>({ size }, 'no-image')}>
            <CWText
              type={sizeIsAboveLarge ? 'h5' : 'caption'}
              className="avatar-no-image-letter"
              fontWeight="medium"
            >
              {community.name?.slice(0, 1)}
            </CWText>
          </div>
        )}
      </div>
    );
  }
}
