import ClickAwayListener from '@mui/base/ClickAwayListener';
import type { Placement } from '@popperjs/core/lib';
import clsx from 'clsx';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
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
      | {
          id?: string | number;
          value?: string;
          label: string;
          iconLeft?: IconName;
          type?: 'header' | 'header-divider' | 'contest';
        },
  ) => any;
  onOpen?: () => {};
  onClose?: () => {};
  options:
    | string[]
    | {
        id?: string | number;
        value?: string;
        label: string;
        iconLeft?: IconName;
        type?: 'header' | 'header-divider' | 'contest';
      }[]
    | {}[];
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
        // @ts-expect-error <StrictNullChecks/>
        popoverProps.setAnchorEl(null);
        onClose && (await onClose());
      }}
    >
      {/* needs to be div instead of fragment so listener can work */}
      <div className={containerClassname}>
        {label && <MessageRow label={label} />}
        <CWButton
          type="button"
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

                if (
                  option.type === 'header' ||
                  option.type === 'header-divider'
                ) {
                  return (
                    <CWText
                      type="caption"
                      fontWeight="medium"
                      className={clsx('select-header', {
                        divider: option.type === 'header-divider',
                      })}
                      key={i}
                    >
                      {option.label}
                    </CWText>
                  );
                }

                return (
                  <Option
                    key={i}
                    size={size}
                    label={optionLabel}
                    onClick={async (e) => {
                      e.preventDefault();
                      // @ts-expect-error <StrictNullChecks/>
                      onSelect(option);
                      // @ts-expect-error <StrictNullChecks/>
                      popoverProps.setAnchorEl(null);
                      onClose && (await onClose());
                    }}
                    isSelected={selected === current}
                    iconLeft={option && option.iconLeft ? option.iconLeft : ''}
                    {...(canEditOption &&
                      !option.type && {
                        iconRight: (
                          <CWIconButton
                            iconName="write"
                            iconSize="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              // @ts-expect-error <StrictNullChecks/>
                              popoverProps.setAnchorEl(null);
                              onOptionEdit?.(option);
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
