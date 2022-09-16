/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_popover/cw_filter_menu.scss';

import { CWPopover, SharedPopoverAttrs } from './cw_popover';
import { ComponentType } from '../types';
import { CWCheckbox } from '../cw_checkbox';

export type FilterMenuItemAttrs = {
  label: string;
};

type FilterMenuAttrs = {
  filterMenuItems: Array<FilterMenuItemAttrs>;
} & SharedPopoverAttrs;

export class CWFilterMenu implements m.ClassComponent<FilterMenuAttrs> {
  view(vnode) {
    const { filterMenuItems, trigger } = vnode.attrs;

    return (
      <CWPopover
        content={
          <div class={ComponentType.FilterMenu}>
            {filterMenuItems.map((f) => (
              <CWCheckbox
                // checked={this.checkboxChecked}
                label={f.label}
                onchange={() => {
                  //   this.checkboxChecked = !this.checkboxChecked;
                }}
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
