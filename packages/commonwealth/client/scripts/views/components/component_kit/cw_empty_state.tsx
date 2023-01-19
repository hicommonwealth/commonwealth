/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_empty_state.scss';
import m from 'mithril';

import { CWIcon } from './cw_icons/cw_icon';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';

type EmptyStateAttrs = {
  content: string | m.Vnode;
  iconName?: IconName;
};

export class CWEmptyState extends ClassComponent<EmptyStateAttrs> {
  view(vnode: m.Vnode<EmptyStateAttrs>) {
    const { content, iconName } = vnode.attrs;

    return (
      <div class="EmptyState">
        <div class="inner-content">
          <CWIcon iconName={iconName} iconSize="xl" />
          {typeof content === 'string' ? <CWText>{content}</CWText> : content}
        </div>
      </div>
    );
  }
}
