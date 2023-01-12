/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_popover/cw_filter_menu.scss';
import m from 'mithril';
import { CWButton } from '../cw_button';
import type { CheckboxType } from '../cw_checkbox';
import { CWCheckbox } from '../cw_checkbox';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';

import { CWPopover } from './cw_popover';

type FilterMenuAttrs = {
  filterMenuItems: Array<CheckboxType>;
  header: string;
  onchange: (e?: any) => void;
  selectedItems: Array<string>;
};

// DO NOT USE! DOESN'T WORK YET

export class CWFilterMenu extends ClassComponent<FilterMenuAttrs> {
  view(vnode: m.Vnode<FilterMenuAttrs>) {
    const { filterMenuItems, header, onchange, selectedItems } = vnode.attrs;
    // console.log({ selectedItems });

    return (
      <CWPopover
        content={
          <div class={ComponentType.FilterMenu}>
            <CWText type="b2" fontWeight="bold">
              {header}
            </CWText>
            {filterMenuItems.map((item) => {
              // console.log(
              //   selectedItems,
              //   selectedItems.some((i) => i === item.value)
              // );

              const isChecked =
                selectedItems.find((i) => {
                  return i === item.value;
                }) !== undefined;

              console.log({ isChecked });

              return (
                <CWCheckbox
                  value={item.value}
                  label={item.label}
                  checked={isChecked}
                  onchange={onchange}
                  // disabled={item.disabled}
                />
              );
            })}
          </div>
        }
        interactionType="click"
        trigger={
          <CWButton
            label="Filter"
            buttonType="mini-white"
            iconRight="chevronDown"
            className={getClasses<{ someChecked: boolean }>({
              someChecked: selectedItems.length > 0,
            })}
          />
        }
      />
    );
  }
}
