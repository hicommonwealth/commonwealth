/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_community_avatar.scss';

import { ChainInfo } from 'models';
import { getClasses } from './helpers';
import { ComponentType } from './types';
import { IconSize } from './cw_icons/types';
import { CWText } from './cw_text';

type CommunityAvatarAttrs = {
  community: ChainInfo;
  onclick?: () => void;
  size?: IconSize;
};

export class CWCommunityAvatar
  implements m.ClassComponent<CommunityAvatarAttrs>
{
  view(vnode) {
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
              {community.name.slice(0, 1)}
            </CWText>
          </div>
        )}
      </div>
    );
  }
}
