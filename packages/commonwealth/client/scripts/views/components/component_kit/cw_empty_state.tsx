/* @jsx m */

import m from 'mithril';
import ClassComponent from 'helpers/class_component';

import 'components/component_kit/cw_empty_state.scss';

import { CWIcon } from './cw_icons/cw_icon';
import { IconName } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';
import { ComponentType } from './types';

type EmptyStateAttrs = {
  content: string | m.Vnode;
  iconName?: IconName;
};
export class CWEmptyState extends ClassComponent<EmptyStateAttrs> {
  view(vnode) {
    const { content, iconName } = vnode.attrs;
    return (
      <div class="EmptyState">
        <div class="inner-content">
          <CWIcon componentType={ComponentType.Icon} iconButtonTheme='black' iconName={iconName} iconSize="xl" />
          {typeof content === 'string' ? <CWText>{content}</CWText> : content}
        </div>
      </div>
    );
  }
}
