/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute } from 'mithrilInterop';

import 'components/component_kit/cw_popover/cw_filter_menu.scss';

import { CWPopover } from './cw_popover';
import { ComponentType } from '../types';
import { CheckboxType, CWCheckbox } from '../cw_checkbox';
import { CWText } from '../cw_text';
import { CWButton } from '../cw_button';
import { getClasses } from '../helpers';

type FilterMenuAttrs = {
  filterMenuItems: Array<CheckboxType>;
  header: string;
  onchange: (e?: any) => void;
  selectedItems: Array<string>;
};

// DO NOT USE! DOESN'T WORK YET

export class CWFilterMenu extends ClassComponent<FilterMenuAttrs> {
  view(vnode: ResultNode<FilterMenuAttrs>) {
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
