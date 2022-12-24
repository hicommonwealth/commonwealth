/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

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

export class CWCommunityAvatar extends ClassComponent<CommunityAvatarAttrs> {
  view(vnode: ResultNode<CommunityAvatarAttrs>) {
    const { community, onclick, size = 'large' } = vnode.attrs;

    const sizeIsAboveLarge =
      size !== 'small' && size !== 'medium' && size !== 'large';

    return (
      <div
        className={getClasses<{ onclick: boolean; size: IconSize }>(
          { onclick: !!onclick, size },
          ComponentType.CommunityAvatar
        )}
        onClick={onclick}
      >
        {community.iconUrl ? (
          <img className="community-image" src={community.iconUrl} />
        ) : (
          <div className={getClasses<{ size: IconSize }>({ size }, 'no-image')}>
            <CWText
              type={sizeIsAboveLarge ? 'h5' : 'caption'}
              class="avatar-no-image-letter"
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
