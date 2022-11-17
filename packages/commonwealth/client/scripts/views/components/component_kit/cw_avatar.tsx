/* @jsx m */

import m from 'mithril';
import jdenticon from 'jdenticon';

import 'components/component_kit/cw_avatar.scss';

import { ComponentType } from './types';

type BaseAvatarAttrs = {
  size: number;
};

type AvatarAttrs = BaseAvatarAttrs & { avatarUrl: string };

export class CWAvatar implements m.ClassComponent<AvatarAttrs> {
  view(vnode: m.Vnode<AvatarAttrs>) {
    const { avatarUrl, size } = vnode.attrs;

    return (
      <div
        class={ComponentType.Avatar}
        style={`width: ${size}px; height: ${size}px; background-image: url('${avatarUrl}');`}
      />
    );
  }
}

type JdenticonAttrs = BaseAvatarAttrs & { address?: string };

export class CWJdenticon implements m.ClassComponent<JdenticonAttrs> {
  view(vnode: m.Vnode<JdenticonAttrs>) {
    const { address, size } = vnode.attrs;
    if (!address) return null;

    return (
      <svg
        width={size}
        height={size}
        data-address={address.toString()}
        oncreate={(vvnode) => {
          jdenticon.update(vvnode.dom as HTMLElement, address);
        }}
        onupdate={(vvnode) => {
          jdenticon.update(vvnode.dom as HTMLElement, address);
        }}
      />
    );
  }
}
