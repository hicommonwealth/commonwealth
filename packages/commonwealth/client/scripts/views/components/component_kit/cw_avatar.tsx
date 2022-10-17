/* @jsx m */

import m from 'mithril';
import jdenticon from 'jdenticon';

import 'components/component_kit/cw_avatar.scss';

import { ComponentType } from './types';

type AvatarAttrs = {
  size: number;
};

export class CWAvatar
  implements m.ClassComponent<AvatarAttrs & { avatarUrl: string }>
{
  view(vnode) {
    const { avatarUrl, size } = vnode.attrs;

    return (
      <div
        class={ComponentType.Avatar}
        style={`width: ${size}px; height: ${size}px; background-image: url('${avatarUrl}');`}
      />
    );
  }
}

export class CWJdenticon
  implements m.ClassComponent<AvatarAttrs & { address?: string }>
{
  view(vnode) {
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
