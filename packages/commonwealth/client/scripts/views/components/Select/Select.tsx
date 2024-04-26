import ClickAwayListener from '@mui/base/ClickAwayListener';
import type { Placement } from '@popperjs/core/lib';
import React from 'react';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { IconName } from '../component_kit/cw_icons/cw_icon_lookup';
import { CWButton } from '../component_kit/new_designs/CWButton';
import { MessageRow } from '../component_kit/new_designs/CWTextInput/MessageRow';
import { Option } from './Option';
import './Select.scss';

export type SelectProps = {
  size?: 'default' | 'compact';
  label?: string;
  placeholder?: string;
  selected: string;
  onSelect?: (
    v:
      | string
      | { id: string | number; value: any; label: string; iconLeft?: IconName },
  ) => any;
  onOpen?: () => {};
  onClose?: () => {};
  options:
    | string[]
    | { id: string | number; value: any; label: string; iconLeft?: IconName }[];
  canEditOption?: boolean;
  onOptionEdit?: (
    v: string | { id: string | number; value: any; label: string },
  ) => any;
  dropdownPosition?: Placement;
  containerClassname?: string;
};

export const Select = ({
  size = 'default',
  options,
  selected,
  onClose,
  onOpen,
  onOptionEdit,
  onSelect,
  canEditOption,
  dropdownPosition,
  placeholder = 'Select an option',
  label = '',
  containerClassname,
}: SelectProps) => {
  const popoverProps = usePopover();

  const selectedOption = (options as any).find(
    (o: any) => o.value === selected || o === selected,
  );

  return (
    <ClickAwayListener
      onClickAway={async () => {
        popoverProps.setAnchorEl(null);
        onClose && (await onClose());
      }}
    >
      {/* needs to be div instead of fragment so listener can work */}
      <div className={containerClassname}>
        {label && <MessageRow label={label} />}
        <CWButton
          className={`Select ${
            popoverProps.anchorEl ? 'active' : ''
          } ${`size-${size}`}`}
          {...(selectedOption &&
            selectedOption.iconLeft && { iconLeft: selectedOption.iconLeft })}
          iconRight={popoverProps.anchorEl ? 'caretUp' : 'caretDown'}
          buttonType="secondary"
          buttonHeight="sm"
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
        <CWPopover
          content={
            <div className="Select-Options-Wrapper">
              {options.map((option, i) => {
                const optionLabel = option.label || option;
                const current = option.value || option;

                return (
                  <Option
                    key={i}
                    size={size}
                    label={optionLabel}
                    onClick={async (e) => {
                      e.preventDefault();
                      onSelect(option);
                      popoverProps.setAnchorEl(null);
                      onClose && (await onClose());
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
                    {...(option.value === 'Archived' && {
                      iconRight: (
                        <CWIconButton iconName="archiveTray" iconSize="small" />
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
