/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover/cw_popover_menu.scss';

import { CWPopover, SharedPopoverAttrs } from './cw_popover';
import { IconName } from '../cw_icons/cw_icon_lookup';
import { ComponentType } from '../types';
import { CWIcon } from '../cw_icons/cw_icon';
import { getClasses } from '../helpers';
import { CWText } from '../cw_text';

export type PopoverMenuItemAttrs =
  | { type: 'divider' }
  | { type: 'header'; label: string }
  | {
      disabled?: boolean;
      iconName?: IconName;
      isSecondary?: boolean;
      label: string;
      onclick: () => void;
      type?: 'action';
    };

class CWPopoverMenuItem implements m.ClassComponent<PopoverMenuItemAttrs> {
  view(vnode) {
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
              iconName={iconName}
              className="menu-item-icon"
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
  popoverMenuItems: Array<PopoverMenuItemAttrs>;
} & SharedPopoverAttrs;

export class CWPopoverMenu implements m.ClassComponent<PopoverMenuAttrs> {
  view(vnode) {
    const { popoverMenuItems, trigger } = vnode.attrs;

    return (
      <CWPopover
        content={
          <div class={ComponentType.PopoverMenu}>
            {popoverMenuItems.map((item) => (
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
