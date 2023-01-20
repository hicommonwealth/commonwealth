/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_community_avatar.scss';

import { ChainInfo } from 'models';
import { getClasses } from './helpers';
import { ComponentType } from './types';
import { IconSize } from './cw_icons/types';
import { CWText } from './cw_text';

type CommunityAvatarAttrs = {
  community: ChainInfo;
  onClick?: () => void;
  size?: IconSize;
};

export class CWCommunityAvatar extends ClassComponent<CommunityAvatarAttrs> {
  view(vnode: ResultNode<CommunityAvatarAttrs>) {
    const { community, onClick, size = 'large' } = vnode.attrs;

    const sizeIsAboveLarge =
      size !== 'small' && size !== 'medium' && size !== 'large';

    return (
      <div
        className={getClasses<{ onClick: boolean; size: IconSize }>(
          { onClick: !!onClick, size },
          ComponentType.CommunityAvatar
        )}
        onClick={onClick}
      >
        {community.iconUrl ? (
          <img className="community-image" src={community.iconUrl} />
        ) : (
          <div className={getClasses<{ size: IconSize }>({ size }, 'no-image')}>
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
