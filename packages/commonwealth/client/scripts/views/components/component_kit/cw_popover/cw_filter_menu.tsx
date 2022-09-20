/* @jsx m */

import m from 'mithril';

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
  onchange: () => void;
  selectedItems: Array<string>;
};

export class CWFilterMenu implements m.ClassComponent<FilterMenuAttrs> {
  view(vnode) {
    const { filterMenuItems, header, onchange, selectedItems } = vnode.attrs;

    return (
      <CWPopover
        content={
          <div class={ComponentType.FilterMenu}>
            <CWText type="b2" fontWeight="bold">
              {header}
            </CWText>
            {filterMenuItems.map((item) => {
              // console.log(selectedItems.some((i) => i === item.value));
              return (
                <CWCheckbox
                  value={item.value}
                  label={item.label}
                  checked={
                    selectedItems.find((i) => {
                      console.log(item);
                      return i === item.value;
                    }) !== undefined
                  }
                  onchange={onchange}
                  disabled={item.disabled}
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
