/* @jsx m */

import m from 'mithril';
import { MenuItem } from '../../menus/types';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

export class CWPopoverMenuItem implements m.ClassComponent<MenuItem> {
  view(vnode: m.VnodeDOM<any, this>) {
    const { type, label, iconName, onclick, disabled, isSecondary } =
      vnode.attrs;

    if (type === 'header') {
      return (
        <CWText className="menu-section-header-text" type="caption">
          {label}
        </CWText>
      );
    } else if (type === 'divider') {
      return <div class="menu-section-divider" />;
    } else {
      return (
        <div
          class={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
            { disabled, isSecondary },
            'PopoverMenuItem'
          )}
          onclick={onclick}
        >
          {iconName && (
            <CWIcon
              className="menu-item-icon"
              iconName={iconName}
              iconSize="small"
            />
          )}
          <CWText type="b2" className="menu-item-text">
            {label}
          </CWText>
        </div>
      );
    }
  }
}
