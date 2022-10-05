/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_empty_state.scss';

import { CWIcon } from './cw_icons/cw_icon';
import { IconName } from './cw_icons/cw_icon_lookup';

type EmptyStateAttrs = {
  content: m.Vnode;
  iconName?: IconName;
};

export class CWEmptyState implements m.ClassComponent<EmptyStateAttrs> {
  view(vnode) {
    const { content, iconName } = vnode.attrs;
    return (
      <div class="EmptyState">
        <CWIcon iconName={iconName} iconSize="xl" />
        {content}
      </div>
    );
  }
}
