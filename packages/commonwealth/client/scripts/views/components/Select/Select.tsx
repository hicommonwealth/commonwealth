import ClickAwayListener from '@mui/base/ClickAwayListener';
import type { Placement } from '@popperjs/core/lib';
import React from 'react';
import { CWButton } from '../component_kit/cw_button';
import { IconName } from '../component_kit/cw_icons/cw_icon_lookup';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { Popover, usePopover } from '../component_kit/cw_popover/cw_popover';
import { Option } from './Option';
import './Select.scss';

export type SelectProps = {
  placeholder?: string;
  selected: string;
  onSelect?: (
    v:
      | string
      | { id: string | number; value: any; label: string; iconLeft?: IconName }
  ) => any;
  onOpen?: () => {};
  onClose?: () => {};
  options:
    | string[]
    | { id: string | number; value: any; label: string; iconLeft?: IconName }[];
  canEditOption?: boolean;
  onOptionEdit?: (
    v: string | { id: string | number; value: any; label: string }
  ) => any;
  dropdownPosition?: Placement;
};

export const Select = ({
  options,
  selected,
  onClose,
  onOpen,
  onOptionEdit,
  onSelect,
  canEditOption,
  dropdownPosition,
  placeholder = 'Select an option',
}: SelectProps) => {
  const popoverProps = usePopover();

  const selectedOption = (options as any).find(
    (o: any) => o.value === selected || o === selected
  );

  return (
    <ClickAwayListener
      onClickAway={async () => {
        popoverProps.setAnchorEl(null);
        onClose && (await onClose());
      }}
    >
      {/* needs to be div instead of fragment so listener can work */}
      <div>
        <CWButton
          className="select"
          {...(selectedOption &&
            selectedOption.iconLeft && { iconLeft: selectedOption.iconLeft })}
          iconRight={popoverProps.anchorEl ? 'carotUp' : 'carotDown'}
          buttonType="mini-white"
          label={
            selectedOption
              ? selectedOption.label || selectedOption
              : placeholder
          }
          onClick={async (e) => {
            popoverProps.handleInteraction(e);
            onOpen && (await onOpen());
          }}
        />
        <Popover
          content={
            <div className="select-options-wrapper">
              {options.map((option, i) => {
                const label = option.label || option;
                const current = option.value || option;

                return (
                  <Option
                    key={i}
                    label={label}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelect(option);
                    }}
                    isSelected={selected === current}
                    iconLeft={option && option.iconLeft ? option.iconLeft : ''}
                    {...(canEditOption && {
                      iconRight: (
                        <CWIconButton
                          iconName="write"
                          iconSize="small"
                          onClick={async (e) => {
                            e.stopPropagation();
                            popoverProps.setAnchorEl(null);
                            onOptionEdit && (await onOptionEdit(option));
                          }}
                        />
                      ),
                    })}
                  />
                );
              })}
            </div>
          }
          placement={dropdownPosition || 'bottom-start'}
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
