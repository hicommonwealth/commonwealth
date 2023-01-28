/* @jsx jsx */
import React from 'react';

import { ClassComponent, ResultNode, jsx } from 'mithrilInterop';
import Jdenticon from 'react-jdenticon';

import 'components/component_kit/cw_avatar.scss';
import jdenticon from 'jdenticon';
import m from 'mithril';

import { ComponentType } from './types';

type BaseAvatarAttrs = {
  size: number;
};

type AvatarAttrs = BaseAvatarAttrs & { avatarUrl: string };

export class CWAvatar extends ClassComponent<AvatarAttrs> {
  view(vnode: ResultNode<AvatarAttrs>) {
    const { avatarUrl, size } = vnode.attrs;

    return (
      <div
        className={ComponentType.Avatar}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundImage: `url("${avatarUrl}")`,
        }}
      />
    );
  }
}

type JdenticonAttrs = BaseAvatarAttrs & { address?: string };

export class CWJdenticon extends ClassComponent<JdenticonAttrs> {
  view(vnode: ResultNode<JdenticonAttrs>) {
    const { address, size } = vnode.attrs;
    if (!address) return null;

    return <Jdenticon value={address.toString()} height={size} width={size} />;
  }
}
