/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover/cw_filter_menu.scss';

import { CWPopover, SharedPopoverAttrs } from './cw_popover';
import { ComponentType } from '../types';
import { CWCheckbox } from '../cw_checkbox';
import { CWText } from '../cw_text';

export type FilterMenuItemAttrs = {
  label: string;
  checked: boolean;
  onchange: (e?: any) => void;
};

type FilterMenuAttrs = {
  filterMenuItems: Array<FilterMenuItemAttrs>;
  header: string;
} & SharedPopoverAttrs;

export class CWFilterMenu implements m.ClassComponent<FilterMenuAttrs> {
  view(vnode) {
    const { filterMenuItems, header, trigger } = vnode.attrs;

    return (
      <CWPopover
        content={
          <div class={ComponentType.FilterMenu}>
            <CWText>{header}</CWText>
            {filterMenuItems.map((f) => (
              <CWCheckbox
                checked={f.checked}
                label={f.label}
                onchange={f.onchange}
              />
            ))}
          </div>
        }
        interactionType="click"
        trigger={trigger}
      />
    );
  }
}
