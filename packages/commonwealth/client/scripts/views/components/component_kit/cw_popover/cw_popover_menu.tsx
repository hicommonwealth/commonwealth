/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover/cw_popover_menu.scss';

import { CWPopover, SharedPopoverAttrs } from './cw_popover';
import { ComponentType } from '../types';
import { getClasses } from '../helpers';
import { CWMenuItem, MenuItemAttrs } from '../cw_menu_item';

type PopoverMenuAttrs = {
  menuItems: Array<MenuItemAttrs>;
} & SharedPopoverAttrs;

export class CWPopoverMenu implements m.ClassComponent<PopoverMenuAttrs> {
  view(vnode) {
    const { className, menuItems, trigger } = vnode.attrs;
    if (!menuItems) {
      console.log({ className, trigger });
    }
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
              <CWMenuItem {...item} />
            ))}
          </div>
        }
        interactionType="click"
        trigger={trigger}
      />
    );
  }
}
