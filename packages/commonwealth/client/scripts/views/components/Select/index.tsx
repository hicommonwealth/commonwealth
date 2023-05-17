import ClickAwayListener from '@mui/base/ClickAwayListener';
import type { Placement } from '@popperjs/core/lib';
import React, { ReactNode } from 'react';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWButton } from '../component_kit/cw_button';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { IconName } from '../component_kit/cw_icons/cw_icon_lookup';
import { Popover, usePopover } from '../component_kit/cw_popover/cw_popover';
import { getClasses } from '../component_kit/helpers';
import './index.scss';

export type OptionProps = {
  iconLeft?: IconName;
  iconRight?: ReactNode;
  isSelected: boolean;
  label: string;
  onClick: (e: any) => void;
};

export const Option = (props: OptionProps) => {
  const { iconRight, isSelected, label, onClick, iconLeft } = props;

  return (
    <div
      className={getClasses<{ isSelected: boolean }>(
        { isSelected },
        'select-option'
      )}
      onClick={onClick}
    >
      {iconLeft && <CWIcon iconName={iconLeft} iconSize="small" />}
      <p>{label}</p>
      {iconRight}
    </div>
  );
};

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

export const Select = (props: SelectProps) => {
  const popoverProps = usePopover();

  const selectedOption = (props.options as any).find(
    (o: any) => o.value === props.selected || o === props.selected
  );

  return (
    <ClickAwayListener
      onClickAway={async () => {
        console.log('outside');
        popoverProps.setAnchorEl(null);
        props.onClose && (await props.onClose());
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
          label={selectedOption.label || selectedOption}
          onClick={async (e) => {
            popoverProps.handleInteraction(e);
            props.onOpen && (await props.onOpen());
          }}
        />
        <Popover
          content={
            <div className="select-options-wrapper">
              {props.options.map((option, i) => {
                const label = option.label || option;
                const current = option.value || option;

                return (
                  <Option
                    key={i}
                    label={label}
                    onClick={(e) => {
                      e.preventDefault();
                      props.onSelect(option);
                    }}
                    isSelected={props.selected === current}
                    iconLeft={option && option.iconLeft ? option.iconLeft : ''}
                    {...(props.canEditOption && {
                      iconRight: (
                        <CWIconButton
                          iconName="write"
                          iconSize="small"
                          onClick={async (e) => {
                            e.stopPropagation();
                            popoverProps.setAnchorEl(null);
                            props.onOptionEdit &&
                              (await props.onOptionEdit(option));
                          }}
                        />
                      ),
                    })}
                  />
                );
              })}
            </div>
          }
          placement={props.dropdownPosition || 'bottom-start'}
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
