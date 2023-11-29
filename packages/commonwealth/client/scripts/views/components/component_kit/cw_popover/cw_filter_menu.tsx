import ClickAwayListener from '@mui/base/ClickAwayListener';
import React from 'react';

import 'components/component_kit/cw_popover/cw_filter_menu.scss';

import { CWButton } from '../cw_button';
import type { CheckboxType } from '../cw_checkbox';
import { CWCheckbox } from '../cw_checkbox';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';
import { Popover, usePopover } from './cw_popover';

type FilterMenuProps = {
  filterMenuItems: Array<CheckboxType>;
  header: string;
  onChange: (e?: any) => void;
  selectedItems: Array<string>;
};

export const CWFilterMenu = (props: FilterMenuProps) => {
  const { filterMenuItems, header, onChange, selectedItems } = props;

  const popoverProps = usePopover();

  return (
    <ClickAwayListener onClickAway={() => popoverProps.setAnchorEl(null)}>
      {/* needs to be div instead of fragment so listener can work */}
      <div>
        <CWButton
          label="Filter"
          buttonType="mini-white"
          iconRight="chevronDown"
          className={getClasses<{ someChecked: boolean }>({
            someChecked: selectedItems.length > 0,
          })}
          onClick={popoverProps.handleInteraction}
        />
        <Popover
          content={
            <div className={ComponentType.FilterMenu}>
              <CWText type="b2" fontWeight="bold">
                {header}
              </CWText>
              {filterMenuItems.map((item, i) => {
                const isChecked =
                  selectedItems.find((itemToCheck) => {
                    return itemToCheck === item.value;
                  }) !== undefined;

                return (
                  <CWCheckbox
                    key={i}
                    value={item.value}
                    label={item.label}
                    checked={isChecked}
                    onChange={onChange}
                  />
                );
              })}
            </div>
          }
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
