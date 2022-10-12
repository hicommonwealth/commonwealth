/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover/cw_popover_menu.scss';

import { MenuItem } from 'views/menus/types';
import { CWPopover, SharedPopoverAttrs } from './cw_popover';
import { ComponentType } from '../types';
import { getClasses } from '../helpers';
import { CWIcon } from '../cw_icons/cw_icon';
import { CWText } from '../cw_text';

class CWPopoverMenuItem implements m.ClassComponent<MenuItem> {
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

type PopoverMenuAttrs = {
  menuItems: Array<MenuItem>;
} & SharedPopoverAttrs;

export class CWPopoverMenu implements m.ClassComponent<PopoverMenuAttrs> {
  view(vnode) {
    const { className, menuItems, trigger } = vnode.attrs;

    return (
      <CWPopover
        content={
          <div
            class={getClasses<{ className?: string }>(
              { className },
              ComponentType.PopoverMenu
            )}
          >
            {menuItems.map((item) => (
              <CWPopoverMenuItem {...item} />
            ))}
          </div>
        }
        interactionType="click"
        trigger={trigger}
      />
    );
  }
}
