/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover/cw_popover_menu.scss';

import { MenuItem } from 'views/menus/types';
import { CWPopover, SharedPopoverAttrs } from './cw_popover';
import { ComponentType } from '../types';
import { getClasses } from '../helpers';
import { CWPopoverMenuItem } from '../cw_popover_menu_item';

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
