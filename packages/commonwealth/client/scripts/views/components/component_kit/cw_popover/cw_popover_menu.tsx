/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover/cw_popover_menu.scss';

import { CWPopover, SharedPopoverAttrs } from './cw_popover';
import { ComponentType, MenuItem } from '../types';
import { getClasses } from '../helpers';
import { CWIcon } from '../cw_icons/cw_icon';
import { CWText } from '../cw_text';

class CWPopoverMenuItem implements m.ClassComponent<MenuItem> {
  view(vnode: m.VnodeDOM<MenuItem, this>) {
    if (vnode.attrs.type === 'header') {
      return (
        <CWText className="menu-section-header-text" type="caption">
          {vnode.attrs.label}
        </CWText>
      );
    } else if (vnode.attrs.type === 'divider') {
      return <div class="menu-section-divider" />;
    } else if (vnode.attrs.type === 'default') {
      const { disabled, isSecondary, iconLeft, label } = vnode.attrs;
      return (
        <div
          class={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
            { disabled, isSecondary },
            'PopoverMenuItem'
          )}
          onclick={onclick}
        >
          {iconLeft && (
            <CWIcon
              className="menu-item-icon"
              iconName={iconLeft}
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
              <CWPopoverMenuItem type={item.type || 'default'} {...item} />
            ))}
          </div>
        }
        interactionType="click"
        trigger={trigger}
      />
    );
  }
}
