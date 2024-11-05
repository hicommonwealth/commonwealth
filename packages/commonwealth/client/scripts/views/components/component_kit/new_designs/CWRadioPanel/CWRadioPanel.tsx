import clsx from 'clsx';
import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import CWPopover, {
  CWPopoverProps,
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { ComponentType } from 'views/components/component_kit/types';

import './CWRadioPanel.scss';

interface CWRadioPanelProps<T> {
  value: T;
  popover?: Pick<CWPopoverProps, 'title' | 'body'>;
  label: string;
  description: string;
  isSelected: boolean;
  onSelect: (value: T) => void;
  disabled?: boolean;
}

const CWRadioPanel = <T,>({
  value,
  label,
  description,
  popover,
  isSelected,
  onSelect,
  disabled,
}: CWRadioPanelProps<T>) => {
  const popoverProps = usePopover();

  return (
    <button
      className={clsx(ComponentType.RadioPanel, {
        selected: isSelected,
        disabled,
      })}
      disabled={disabled}
      onClick={() => onSelect(value)}
    >
      <div className="top-row">
        <CWRadioButton
          checked={isSelected}
          value={value as string}
          label={label}
          disabled={disabled}
        />
        {popover && (
          <>
            <CWIconButton
              iconName="infoEmpty"
              buttonSize="sm"
              onMouseEnter={popoverProps.handleInteraction}
              onMouseLeave={popoverProps.handleInteraction}
            />
            <CWPopover
              title={<>{popover.title}</>}
              body={popover.body}
              {...popoverProps}
            />
          </>
        )}
      </div>
      <CWText className="option-description">{description}</CWText>
    </button>
  );
};

export default CWRadioPanel;
